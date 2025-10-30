# 用户注册追踪系统

## 简介

这是一个基于 SillyTavern EJS 模板扩展的用户注册和追踪系统框架。当用户输入特定名字后，系统会自动记录并追踪用户信息，实现个性化的对话体验。

## 功能特性

- ✅ 自动检测注册关键词（"注册"、"register"、"登记"等）
- ✅ 智能提取用户名字（支持多种输入格式）
- ✅ 名字确认机制（避免误识别）
- ✅ 用户档案管理（名字、注册时间、互动次数、好感度等）
- ✅ 实时状态显示（在提示词和渲染中显示用户信息）
- ✅ 持久化存储（跨会话保存用户数据）

## 文件说明

| 文件 | 说明 | 用途 |
|------|------|------|
| `01-initial-variables.json` | 初始变量配置 | 定义注册系统的数据结构 |
| `02-registration-detector.md` | 注册检测条目 | 检测用户是否想要注册 |
| `03-registration-handler.md` | 注册处理器 | 提取名字并处理注册逻辑 |
| `04-status-display.md` | 状态显示 | 显示用户档案和系统状态 |

## 安装步骤

### 前置要求

1. 已安装 SillyTavern
2. 已安装并启用 **Prompt Template** 扩展
3. 已创建或打开一个角色卡

### 安装步骤

#### 步骤 1：创建世界书

1. 在 SillyTavern 中，点击 **世界书** 图标
2. 点击 **新建世界书**，命名为 `用户注册系统`
3. 将新建的世界书附加到当前角色卡上

#### 步骤 2：添加初始变量条目

1. 在世界书中创建新条目
2. **标题（备注）**：输入 `[InitialVariables]`
3. **激活状态**：设置为 🔵 启用（如果扩展设置中"GENERATE/RENDER/INJECT条目禁用视为启用"开启，则设置为🟢禁用）
4. **主要关键字**：留空
5. **条目顺序**：`1`
6. **内容**：复制 `01-initial-variables.json` 的内容（JSON格式）

```json
{
  "注册系统": {
    "已注册用户": {},
    "当前会话用户": null,
    "注册模式": false,
    "等待确认": false,
    "临时名字": null
  }
}
```

#### 步骤 3：添加注册检测条目

1. 创建新条目
2. **标题（备注）**：输入 `[GENERATE:REGEX:注册|register|登记]`
3. **激活状态**：🔵 启用
4. **主要关键字**：留空
5. **条目顺序**：`10`
6. **内容**：复制 `02-registration-detector.md` 中的 JavaScript 代码部分

#### 步骤 4：添加注册处理器条目

1. 创建新条目
2. **标题（备注）**：输入 `注册处理器`
3. **激活状态**：🔵 启用
4. **主要关键字**：留空
5. **条目顺序**：`20`
6. **内容**：复制 `03-registration-handler.md` 中的内容（包括装饰器 `@@generate_before`）

#### 步骤 5：添加状态显示条目

1. 创建新条目
2. **标题（备注）**：输入 `用户状态栏`
3. **激活状态**：🔵 启用
4. **主要关键字**：留空
5. **条目顺序**：`50`
6. **内容**：复制 `04-status-display.md` 中第一个条目的内容（包括装饰器 `@@generate_after`）

#### 步骤 6（可选）：添加渲染状态栏

如果想在每条AI消息末尾显示用户状态HTML卡片：

1. 创建新条目
2. **标题（备注）**：输入 `渲染状态栏`
3. **激活状态**：🔵 启用
4. **主要关键字**：留空
5. **条目顺序**：`100`
6. **内容**：复制 `04-status-display.md` 中第二个条目的内容（包括装饰器 `@@render_after` 和 `@@message_formatting`）

## 使用方法

### 基本使用流程

1. **启动对话**
   - 打开角色卡并开始对话

2. **触发注册**
   - 用户输入：`我想注册` 或 `register` 或 `登记`
   - AI会引导用户提供名字

3. **提供名字**
   - 用户输入：`我叫张三` 或 `我是李四` 或 `王五`（直接输入名字）
   - 系统会提取名字并要求确认

4. **确认名字**
   - AI询问：`你的名字是张三，对吗？`
   - 用户回复：`是的` 或 `对` 或 `正确`
   - 注册完成！

5. **查看状态**
   - 注册后，每次对话时会自动显示用户档案信息
   - 互动次数会自动累加

### 支持的输入格式

#### 注册触发关键词
- 中文：`注册`、`登记`
- 英文：`register`
- 示例：`我想注册`、`register me`

#### 名字输入格式
- `我叫XXX`
- `我是XXX`
- `名字是XXX`
- `叫我XXX`
- `call me XXX`
- `my name is XXX`
- 直接输入名字（如 `张三`）

#### 确认关键词
- 肯定：`是的`、`对`、`没错`、`正确`、`yes`、`确认`
- 否定：`不是`、`错了`、`不对`、`no`、`重新`

## 数据结构

### 注册系统变量结构

```javascript
{
  "注册系统": {
    "已注册用户": {
      "张三": {
        "名字": "张三",
        "注册时间": "2025-10-30T12:00:00.000Z",
        "最后活跃": "2025-10-30T12:30:00.000Z",
        "互动次数": 5,
        "好感度": 20,
        "备注": {}
      }
    },
    "当前会话用户": "张三",
    "注册模式": false,
    "等待确认": false,
    "临时名字": null
  }
}
```

### 变量访问方法

在其他世界书条目或EJS代码中访问用户数据：

```javascript
// 获取当前用户名字
<%- getvar('注册系统.当前会话用户') %>

// 获取当前用户的好感度
<%- getvar('注册系统.已注册用户.' + getvar('注册系统.当前会话用户') + '.好感度', {defaults: 0}) %>

// 更新用户好感度
<%
const userName = getvar('注册系统.当前会话用户');
const currentAffinity = getvar(`注册系统.已注册用户.${userName}.好感度`, {defaults: 0});
setvar(`注册系统.已注册用户.${userName}.好感度`, currentAffinity + 10);
%>
```

## 扩展功能示例

### 1. 好感度系统集成

创建一个新的世界书条目来根据对话内容自动调整好感度：

```javascript
@@generate_after
<%
const userName = getvar('注册系统.当前会话用户');
if (userName) {
    const lastUserMsg = _.findLast(context.chat, msg => msg.is_user);
    if (lastUserMsg && lastUserMsg.mes) {
        const msg = lastUserMsg.mes;
        let affinityChange = 0;

        // 正面关键词
        if (/谢谢|感谢|你真好|喜欢你/.test(msg)) {
            affinityChange += 5;
        }
        // 负面关键词
        if (/讨厌|烦人|走开/.test(msg)) {
            affinityChange -= 3;
        }

        if (affinityChange !== 0) {
            const currentAffinity = getvar(`注册系统.已注册用户.${userName}.好感度`, {defaults: 0});
            setvar(`注册系统.已注册用户.${userName}.好感度`, currentAffinity + affinityChange);
        }
    }
}
%>
```

### 2. 用户备注系统

允许AI记录关于用户的特殊信息：

```javascript
<%
const userName = getvar('注册系统.当前会话用户');
if (userName) {
    // 添加用户喜好
    setvar(`注册系统.已注册用户.${userName}.备注.喜欢的颜色`, '蓝色');

    // 读取用户喜好
    const favoriteColor = getvar(`注册系统.已注册用户.${userName}.备注.喜欢的颜色`);
}
%>
```

### 3. 多用户切换

创建切换用户的命令：

```javascript
// 在世界书条目中
[GENERATE:REGEX:切换用户|switch user]

<%
const allUsers = getvar('注册系统.已注册用户', {defaults: {}});
const userList = Object.keys(allUsers);

if (userList.length > 0) {
-%>
[系统提示：当前已注册用户列表：<%- userList.join('、') %>，请引导用户选择要切换的用户]
<%
}
%>
```

## 故障排除

### 问题 1：变量没有保存

**解决方案**：
- 确保扩展设置中"自动保存变量更新"已开启，或者在聊天结束时手动保存
- 检查浏览器控制台是否有错误信息

### 问题 2：条目没有触发

**解决方案**：
- 检查世界书是否已附加到角色卡
- 确认条目的激活状态与扩展设置中的"GENERATE/RENDER/INJECT条目禁用视为启用"选项匹配
- 在扩展设置中开启"控制台显示详细信息"，查看详细日志

### 问题 3：正则表达式不匹配

**解决方案**：
- 确保正则表达式语法正确
- 测试时在浏览器控制台输入 `getvar('注册系统')` 查看当前状态
- 检查是否有其他正则表达式条目冲突

### 问题 4：名字提取失败

**解决方案**：
- 确保用户输入符合支持的格式
- 可以修改 `03-registration-handler.md` 中的 `namePatterns` 正则表达式来支持更多格式

## 高级配置

### 调整条目顺序

条目执行顺序由"条目顺序"数字决定（数字越小越先执行）：

1. `[InitialVariables]` - 顺序 1（最先初始化变量）
2. 注册检测 - 顺序 10
3. 注册处理器 - 顺序 20
4. 状态显示 - 顺序 50
5. 渲染状态栏 - 顺序 100

### 自定义状态显示

可以修改 `04-status-display.md` 中的显示格式，例如：

```javascript
---
【用户：<%- userProfile.名字 %>】好感度 <%- userProfile.好感度 %>/100
---
```

### 禁用某些功能

如果不需要某个功能，可以：
- 禁用对应的世界书条目（设置为🟢禁用，并确保不在特殊标题范围内）
- 或者删除对应的条目

## 相关文档

- [SillyTavern 官方文档](https://docs.sillytavern.app/)
- [EJS 语法参考](https://ejs.co/)
- [Prompt Template 扩展功能说明](../../docs/features_cn.md)
- [Prompt Template API 参考](../../docs/reference_cn.md)

## 贡献与反馈

如果您有改进建议或发现问题，欢迎：
- 提交 Issue
- 创建 Pull Request
- 分享您的使用案例

## 许可证

本示例框架基于 AGPL-3.0 许可证，与主项目保持一致。
