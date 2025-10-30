# 名字提取和注册处理条目

## 世界书条目配置说明
- **条目标题（备注）**: `注册处理器`
- **激活状态**: 🔵 启用
- **主要关键字**: 留空
- **条目顺序**: 20
- **装饰器**: `@@generate_before`（在发送给LLM前执行）

## 条目内容

```javascript
@@generate_before
<%
// 获取注册系统变量
const regSystem = getvar('注册系统', { defaults: {} });

// 如果处于注册模式
if (regSystem.注册模式) {
    // 获取最后一条用户消息
    const lastUserMsg = _.findLast(context.chat, msg => msg.is_user);

    if (lastUserMsg) {
        const userInput = lastUserMsg.mes || '';

        // 尝试从用户消息中提取名字
        // 匹配模式："我叫XXX"、"我是XXX"、"名字是XXX"、"叫我XXX"、直接输入名字
        const namePatterns = [
            /(?:我叫|我是|名字[是叫]|叫我|call me|my name is)\s*([^\s，。！？,.!?]{1,20})/i,
            /^([^\s，。！？,.!?]{1,20})$/  // 单独的名字
        ];

        let extractedName = null;
        for (const pattern of namePatterns) {
            const match = userInput.match(pattern);
            if (match && match[1]) {
                extractedName = match[1].trim();
                break;
            }
        }

        if (extractedName) {
            // 保存临时名字并等待确认
            setvar('注册系统.临时名字', extractedName);
            setvar('注册系统.等待确认', true);

            // 提示AI确认用户名字
            print(`\n[系统提示：检测到用户名字可能是"${extractedName}"，请向用户确认是否正确]\n`);
        }
    }
}

// 如果等待确认且用户回复了
if (regSystem.等待确认) {
    const lastUserMsg = _.findLast(context.chat, msg => msg.is_user);

    if (lastUserMsg) {
        const userInput = lastUserMsg.mes || '';

        // 检测确认关键词
        const confirmPatterns = /是的|对|没错|正确|yes|correct|对的|嗯|确认/i;
        const denyPatterns = /不是|错了|不对|no|wrong|不|重新/i;

        if (confirmPatterns.test(userInput)) {
            // 用户确认，完成注册
            const userName = regSystem.临时名字;
            const timestamp = new Date().toISOString();

            // 创建用户档案
            const userProfile = {
                名字: userName,
                注册时间: timestamp,
                最后活跃: timestamp,
                互动次数: 0,
                好感度: 0,
                备注: {}
            };

            // 保存到已注册用户列表
            setvar(`注册系统.已注册用户.${userName}`, userProfile);
            // 设置当前会话用户
            setvar('注册系统.当前会话用户', userName);
            // 清理临时状态
            setvar('注册系统.注册模式', false);
            setvar('注册系统.等待确认', false);
            setvar('注册系统.临时名字', null);

            print(`\n[系统提示：用户"${userName}"注册成功！可以开始个性化互动]\n`);

        } else if (denyPatterns.test(userInput)) {
            // 用户否认，重新输入
            setvar('注册系统.等待确认', false);
            setvar('注册系统.临时名字', null);

            print(`\n[系统提示：用户否认了名字，请重新询问用户的正确名字]\n`);
        }
    }
}
%>
```
