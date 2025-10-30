# 用户状态显示条目

## 世界书条目配置说明
- **条目标题（备注）**: `用户状态栏`
- **激活状态**: 🔵 启用
- **主要关键字**: 留空
- **条目顺序**: 50
- **装饰器**: `@@generate_after`（在提示词末尾添加）

## 条目内容

```javascript
@@generate_after
<%
// 获取注册系统变量
const regSystem = getvar('注册系统', { defaults: {} });
const currentUser = regSystem.当前会话用户;

// 如果有已登录用户，显示用户信息
if (currentUser) {
    const userProfile = getvar(`注册系统.已注册用户.${currentUser}`, { defaults: null });

    if (userProfile) {
        // 更新最后活跃时间和互动次数
        setvar(`注册系统.已注册用户.${currentUser}.最后活跃`, new Date().toISOString());
        const interactionCount = (userProfile.互动次数 || 0) + 1;
        setvar(`注册系统.已注册用户.${currentUser}.互动次数`, interactionCount);
-%>

---
【当前用户档案】
- 名字：<%- userProfile.名字 %>
- 注册时间：<%- new Date(userProfile.注册时间).toLocaleString('zh-CN') %>
- 互动次数：<%- interactionCount %>
- 好感度：<%- userProfile.好感度 || 0 %>
---
<%
    }
} else if (regSystem.注册模式) {
    // 如果正在注册过程中
    if (regSystem.等待确认 && regSystem.临时名字) {
-%>

【系统状态】正在确认用户名字：<%- regSystem.临时名字 %>
<%
    } else {
-%>

【系统状态】等待用户提供名字
<%
    }
}
%>
```

---

# 渲染时的状态栏显示（可选）

## 世界书条目配置说明
- **条目标题（备注）**: `渲染状态栏`
- **激活状态**: 🔵 启用
- **主要关键字**: 留空
- **条目顺序**: 100
- **装饰器**: `@@render_after` 和 `@@message_formatting`（在消息末尾渲染HTML）

## 条目内容

```javascript
@@render_after
@@message_formatting
<%
// 在每条AI消息末尾显示用户状态
const regSystem = getvar('注册系统', { defaults: {} });
const currentUser = regSystem.当前会话用户;

if (currentUser) {
    const userProfile = getvar(`注册系统.已注册用户.${currentUser}`, { defaults: null });

    if (userProfile) {
-%>
<div style="margin-top: 10px; padding: 8px; background: rgba(100, 150, 200, 0.1); border-left: 3px solid #6496c8; font-size: 0.9em; color: #888;">
    <strong>👤 <%- userProfile.名字 %></strong> |
    💬 互动: <%- userProfile.互动次数 || 0 %> 次 |
    ❤️ 好感度: <%- userProfile.好感度 || 0 %>
</div>
<%
    }
}
%>
```
