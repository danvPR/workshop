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
  let lastRequestTime = 0; // Đã sửa lỗi biến chưa khai báo

  // Bản đồ quản lý các lệnh thanh toán đang chờ phản hồi từ trang web cha
  const pendingPaymentResolvers = new Map();

  // Kiểm tra xem game có đang được nhúng trong iframe hay không
  function isEmbedded() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // 1. GỬI TÍN HIỆU BẮT TAY (HANDSHAKE) LÊN TRANG WEB CHA
  function sendHandshake() {
    if (!isEmbedded()) return;
    window.parent.postMessage({ type: "DANV_WOW_HANDSHAKE" }, "*");
  }

  // Khởi động bắt tay ngay khi nạp extension
  sendHandshake();

  // 2. LẮNG NGHE TÍN HIỆU PHẢN HỒI TỪ TRANG WEB CHA (DANVWORKSHOP)
  window.addEventListener("message", (event) => {
    // Chỉ chấp nhận tin nhắn từ các domain tin cậy của bạn
    const isAllowedOrigin = TRUSTED_PARENT_ORIGINS.some(origin => event.origin.startsWith(origin));
    if (!isAllowedOrigin) return;

    const data = event.data;
    if (!data || !data.type) return;

    // A. NHẬN DỮ LIỆU ĐỒNG BỘ BAN ĐẦU
    if (data.type === "DANV_WOW_INIT") {
      isLoggedIn = !!data.isLoggedIn;
      currentUsername = data.username || "";
      userBalance = parseInt(data.balance) || 0;
    }

    // B. NHẬN KẾT QUẢ THANH TOÁN TỪ MODAL TRANG CHA
    if (data.type === "DANV_WOW_PAY_RESPONSE") {
      const resolverObj = pendingPaymentResolvers.get(data.requestId);
      if (resolverObj) {
        // Xóa bộ hẹn giờ timeout chống treo
        clearTimeout(resolverObj.timer);

        lastTxStatus = data.status || "FAILED";

        if (data.status === "SUCCESS") {
          userBalance = parseInt(data.newBalance);
          lastTxId = data.txId || "";
          resolverObj.resolve(true); // Mở khóa block: Trả về thành công
        } else {
          resolverObj.resolve(false); // Mở khóa block: Trả về thất bại / hủy bỏ
        }

        pendingPaymentResolvers.delete(data.requestId);
      }
    }
  });

  // 3. ĐĂNG KÝ BỘ KHỐI LỆNH SCRATCH TRONG AFTERCODE
  class DANVWowEconomyExtension {
    getInfo() {
      return {
        id: "danvWowEconomy",
        name: "WOW Economy",
        color1: "#f59e0b", // Vàng cam năng lượng
        color2: "#d97706",
        color3: "#b45309",
        blockIconURI: WOW_ICON_URL,
        menuIconURI: WOW_ICON_URL,
        blocks: [
          // Block 1: Kiểm tra trạng thái kết nối
          {
            opcode: "checkLoggedIn",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "đã kết nối tài khoản DANV?"
          },
          // Block 2: Lấy tên người chơi đang đăng nhập
          {
            opcode: "getUsername",
            blockType: Scratch.BlockType.REPORTER,
            text: "tên người chơi DANV"
          },
          // Block 3: Lấy số dư WOW
          {
            opcode: "getBalance",
            blockType: Scratch.BlockType.REPORTER,
            text: "số dư WOW hiện tại"
          },
          "---",
          // Block 4: Yêu cầu thanh toán (Block có tính năng chờ Modal cha phản hồi)
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
          // Block 5: Boolean kiểm tra giao dịch gần nhất
          {
            opcode: "isLastTxSuccess",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "giao dịch gần nhất thành công?"
          },
          // Block 6: Trạng thái giao dịch dạng chữ (SUCCESS, USER_CANCELLED, INSUFFICIENT,...)
          {
            opcode: "getLastTxStatus",
            blockType: Scratch.BlockType.REPORTER,
            text: "trạng thái giao dịch gần nhất"
          },
          // Block 7: Mã hóa đơn / Transaction ID
          {
            opcode: "getLastTxId",
            blockType: Scratch.BlockType.REPORTER,
            text: "mã giao dịch (TX ID) gần nhất"
          },
          "---",
          // Block 8: Đồng bộ làm mới số dư thủ công
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

    // XỬ LÝ KHỐI LỆNH YÊU CẦU THANH TOÁN (ASYNC PROMISE)
    requestPaymentAndWait(args) {
      const amount = Math.max(1, Math.floor(Number(args.AMOUNT) || 0));
      const reason = String(args.REASON || "Vật phẩm trong game").trim();

      // Trường hợp 1: Game đang chạy độc lập (không nhúng trên DANVworkshop)
      if (!isEmbedded()) {
        lastTxStatus = "NOT_EMBEDDED";
        return Promise.resolve();
      }

      // Trường hợp 2: Chặn gọi spam quá dày đặc (dưới 3 giây) chống treo browser
      const now = Date.now();
      if (now - lastRequestTime < 3000) {
        lastTxStatus = "RATE_LIMITED";
        return Promise.resolve();
      }
      lastRequestTime = now;

      // Trường hợp 3: Gửi phiếu yêu cầu lên Web cha (Web cha tự kiểm tra đăng nhập/số dư và kích hoạt modal)
      return new Promise((resolve) => {
        const requestId = "REQ_" + (typeof crypto.randomUUID === "function" 
          ? crypto.randomUUID().slice(0, 10) 
          : Math.random().toString(36).substring(2, 10));

        // Hẹn giờ tự động hủy sau 90 giây nếu người chơi bỏ quên Pop-up
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

        // Bắn tín hiệu lên trang cha mở Pop-up xác nhận
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