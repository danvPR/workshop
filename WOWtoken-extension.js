// Name: DANV WOW Economy
// ID: danvWowEconomy
// Description: Tích hợp hệ thống tiền tệ năng lượng WOW của DANVworkshop vào game
// By: StudioDANV

(function (Scratch) {
  "use strict";

  // Biểu tượng icon WOW năng lượng vàng
  const WOW_ICON_URL = "https://raw.githubusercontent.com/danvPR/workshop/main/Assets/WOW%20Badge.png";

  // Danh sách các domain cha được phép tin cậy
  const TRUSTED_PARENT_ORIGINS = [
    "https://turbows.pages.dev",
    "https://danvpr.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:5500"
  ];

  // Trạng thái cục bộ của ví và giao dịch
  let userBalance = 0;
  let isLoggedIn = false;
  let currentUsername = "";
  let lastTxStatus = "NONE";
  let lastTxId = "";
  let lastRequestTime = 0; 


  const pendingPaymentResolvers = new Map();

  function isEmbedded() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  function sendHandshake() {
    if (!isEmbedded()) return;
    window.parent.postMessage({ type: "DANV_WOW_HANDSHAKE" }, "*");
  }

  sendHandshake();

  window.addEventListener("message", (event) => {
    const isAllowedOrigin = TRUSTED_PARENT_ORIGINS.some(origin => event.origin.startsWith(origin));
    if (!isAllowedOrigin) return;

    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === "DANV_WOW_INIT") {
      isLoggedIn = !!data.isLoggedIn;
      currentUsername = data.username || "";
      userBalance = parseInt(data.balance) || 0;
    }

    if (data.type === "DANV_WOW_PAY_RESPONSE") {
      const resolverObj = pendingPaymentResolvers.get(data.requestId);
      if (resolverObj) {
        clearTimeout(resolverObj.timer);

        lastTxStatus = data.status || "FAILED";

        if (data.status === "SUCCESS") {
          userBalance = parseInt(data.newBalance);
          lastTxId = data.txId || "";
          resolverObj.resolve(true); 
        } else {
          resolverObj.resolve(false); 
        }

        pendingPaymentResolvers.delete(data.requestId);
      }
    }
  });

  class DANVWowEconomyExtension {
    getInfo() {
      return {
        id: "danvWowEconomy",
        name: "WOW Economy",
        color1: "#f59e0b", 
        color2: "#d97706",
        color3: "#b45309",
        blockIconURI: WOW_ICON_URL,
        menuIconURI: WOW_ICON_URL,
        blocks: [

          {
            opcode: "checkLoggedIn",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "đã kết nối tài khoản DANV?"
          },

          {
            opcode: "getUsername",
            blockType: Scratch.BlockType.REPORTER,
            text: "tên người chơi DANV"
          },

          {
            opcode: "getBalance",
            blockType: Scratch.BlockType.REPORTER,
            text: "số dư WOW hiện tại"
          },
          "---",

          {
            opcode: "requestPaymentAndWait",
            blockType: Scratch.BlockType.COMMAND,
            text: "yêu cầu thanh toán [AMOUNT] WOW lý do: [REASON] và chờ",
            arguments: {
              AMOUNT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              },
              REASON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Mua vật phẩm"
              }
            }
          },

          {
            opcode: "isLastTxSuccess",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "giao dịch gần nhất thành công?"
          },

          {
            opcode: "getLastTxStatus",
            blockType: Scratch.BlockType.REPORTER,
            text: "trạng thái giao dịch gần nhất"
          },

          {
            opcode: "getLastTxId",
            blockType: Scratch.BlockType.REPORTER,
            text: "mã giao dịch (TX ID) gần nhất"
          },
          "---",

          {
            opcode: "syncBalanceNow",
            blockType: Scratch.BlockType.COMMAND,
            text: "đồng bộ lại số dư ví với hệ thống"
          }
        ]
      };
    }

    checkLoggedIn() {
      return isLoggedIn;
    }

    getUsername() {
      return currentUsername || "Khách";
    }

    getBalance() {
      return userBalance;
    }

    isLastTxSuccess() {
      return lastTxStatus === "SUCCESS";
    }

    getLastTxStatus() {
      return lastTxStatus;
    }

    getLastTxId() {
      return lastTxId;
    }

    syncBalanceNow() {
      sendHandshake();
    }

    requestPaymentAndWait(args) {
      const amount = Math.max(1, Math.floor(Number(args.AMOUNT) || 0));
      const reason = String(args.REASON || "Vật phẩm trong game").trim();

      if (!isEmbedded()) {
        lastTxStatus = "NOT_EMBEDDED";
        return Promise.resolve();
      }

      const now = Date.now();
      if (now - lastRequestTime < 3000) {
        lastTxStatus = "RATE_LIMITED";
        return Promise.resolve();
      }
      lastRequestTime = now;

      return new Promise((resolve) => {
        const requestId = "REQ_" + (typeof crypto.randomUUID === "function" 
          ? crypto.randomUUID().slice(0, 10) 
          : Math.random().toString(36).substring(2, 10));

        const timeoutTimer = setTimeout(() => {
          if (pendingPaymentResolvers.has(requestId)) {
            lastTxStatus = "TIMEOUT";
            pendingPaymentResolvers.delete(requestId);
            resolve(false);
          }
        }, 90000);

        pendingPaymentResolvers.set(requestId, {
          resolve: resolve,
          timer: timeoutTimer
        });

        window.parent.postMessage({
          type: "DANV_WOW_PAY_REQUEST",
          requestId: requestId,
          amount: amount,
          reason: reason
        }, "*");
      });
    }
  }

  Scratch.extensions.register(new DANVWowEconomyExtension());
})(Scratch);