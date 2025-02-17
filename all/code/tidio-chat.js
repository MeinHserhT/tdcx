//fires on opening tidio chat
window.tidioChatApi.on("open", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Opened Tidio Chat widget",
  });
});
// fires on closing tidio chat
window.tidioChatApi.on("close", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Closed Tidio Chat widget",
  });
});
// fires on first user message
window.tidioChatApi.on("conversationStart", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "User Sent First Message",
  });
});
//fires when an operator sends a mesaage
window.tidioChatApi.on("messageFromOperator", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Message Sent By Operator",
  });
});
//fires when a visitor sends a mesaage
window.tidioChatApi.on("messageFromVisitor", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Message Sent By Visitor",
  });
});
//fires when a visitor submits prefill form
window.tidioChatApi.on("preFormFilled", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Tidio Prefill Form Submitted",
  });
});
//fires when Tido chat status change
window.tidioChatApi.on("setStatus", function (onTidioChatApiReady) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "chat",
    chatAction: "Tidio Chat Status",
  });
});


