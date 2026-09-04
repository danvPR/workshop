// Name: Kết nối với DANVworkshop
// ID: danvNavPixelPerfect
// Description: Nút upload dự án & Tùy chỉnh thanh điều hướng
// By: StudioDANV

(function (Scratch) {
  "use strict";

  const LOGO_URL = 'https://i.ibb.co/9mhxsQM2/ezgif-1b203d38782d98f9.png';
  const EXTENSION_ICON_URL = 'https://i.ibb.co/CpSdZCfv/ezgif-6163dce644345227.png';

  // Xử lý khi chưa bật Unsandboxed
  if (!Scratch.extensions.unsandboxed) {
    class DANVSandboxedNotice {
      getInfo() {
        return {
          id: 'danvNavPixelPerfect',
          name: '⚠️ Đã xảy ra sự cố khi kết nối với DANVworkshop. Vui lòng thử lại sau.',
          blocks: [
            {
              opcode: 'sandboxNotice1',
              blockType: Scratch.BlockType.LABEL,
              text: '⚠️ Hãy bật [ 𝐑𝐮𝐧 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 𝐬𝐚𝐧𝐝𝐛𝐨𝐱 ]'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: ' '
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'Tiện ích này giúp chia sẻ projects của'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'bạn lên thư viện của DANVWorkshop'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'để mọi người đều thấy và trải nghiệm!'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: ' '
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'Bạn có thể kích hoạt lại tiện ích này'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'bằng cách reload lại trang và khi'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'bảng thông báo Security hiện ra,'
            },
            {
              opcode: 'sandboxNotice2',
              blockType: Scratch.BlockType.LABEL,
              text: 'hãy tích ô [ 𝐑𝐮𝐧 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 𝐬𝐚𝐧𝐝𝐛𝐨𝐱 ] '
            },
          ]
        };
      }
    }
    Scratch.extensions.register(new DANVSandboxedNotice());
    return;
  }

  async function handleUploadToWorkshop() {
    try {
      // 1. Mở tab trước để trình duyệt không chặn Popup
      const targetUrl = "https://danvpr.github.io/workshop/#upload";
      const workshopTab = window.open(targetUrl, "_blank");

      if (!workshopTab) {
        alert("Vui lòng cho phép mở Pop-up trên trình duyệt!");
        return;
      }

      // 2. Lấy tên tác phẩm
      let projectTitle = "Dự án mới";
      const titleInput = document.querySelector('input[class*="project-title-input"]');
      if (titleInput && titleInput.value.trim()) {
        projectTitle = titleInput.value.trim();
      }

      // 3. Lệnh chuẩn chụp Thumbnail của Scratch/TurboWarp: requestSnapshot
      const thumbDataUrl = await new Promise((resolve) => {
        let isDone = false;
        const fallbackTimer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            const fallbackCanvas = Scratch.vm?.renderer?.canvas || document.querySelector('canvas');
            resolve(fallbackCanvas ? fallbackCanvas.toDataURL('image/png') : null);
          }
        }, 1500);

        try {
          if (Scratch.vm && Scratch.vm.renderer && typeof Scratch.vm.renderer.requestSnapshot === 'function') {
            Scratch.vm.renderer.requestSnapshot((dataUri) => {
              if (!isDone) {
                isDone = true;
                clearTimeout(fallbackTimer);
                resolve(dataUri);
              }
            });
            Scratch.vm.renderer.draw();
          } else {
            clearTimeout(fallbackTimer);
            const fallbackCanvas = Scratch.vm?.renderer?.canvas || document.querySelector('canvas');
            resolve(fallbackCanvas ? fallbackCanvas.toDataURL('image/png') : null);
          }
        } catch (e) {
          clearTimeout(fallbackTimer);
          resolve(null);
        }
      });

      // 4. Đóng gói file .sb3
      const sb3Blob = await Scratch.vm.saveProjectSb3();
      const sb3ArrayBuffer = await sb3Blob.arrayBuffer();

      // 5. Gửi dữ liệu sang tab Workshop khi sẵn sàng (Đã tối ưu chuyển file lớn siêu tốc)
      let hasSent = false;
      const messageListener = (event) => {
        if (event.data && event.data.type === "DANV_WORKSHOP_READY" && !hasSent) {
          hasSent = true;
          workshopTab.postMessage({
            type: "DANV_IMPORT_PROJECT",
            title: projectTitle,
            sb3Buffer: sb3ArrayBuffer,
            fileName: `${projectTitle}.sb3`,
            thumbDataUrl: thumbDataUrl
          }, "*", [sb3ArrayBuffer]); // Dịch chuyển thẳng cục RAM, không copy

          window.removeEventListener("message", messageListener);
        }
      };

      window.addEventListener("message", messageListener);

    } catch (error) {
      console.error("Lỗi khi xuất file dự án:", error);
      alert("Không thể đóng gói dự án: " + error.message);
    }
  }

  // Chuyển thanh Navigation Bar sang màu đen
  function applyBlackNavBar() {
    const navBar = document.querySelector('[class*="menu-bar_menu-bar"], nav, header');
    if (navBar) {
      navBar.style.backgroundColor = '#000000';
      navBar.style.backgroundImage = 'none';
    }
  }

  // Đổi Logo Scratch/TurboWarp góc trái thành Logo Trang chủ DANVworkshop
  function applyHomeLogoButton() {
    const logoContainer = document.querySelector('[class*="menu-bar_scratch-logo"], [class*="scratch-logo"]');
    if (logoContainer && !logoContainer.dataset.danvHomeBound) {
      logoContainer.dataset.danvHomeBound = "true";
      logoContainer.innerHTML = '';
      logoContainer.style.display = 'inline-flex';
      logoContainer.style.alignItems = 'center';
      logoContainer.style.cursor = 'pointer';
      logoContainer.style.padding = '0 6px';
      logoContainer.title = 'Trang chủ DANVworkshop';

      const homeImg = document.createElement('img');
      homeImg.src = LOGO_URL;
      homeImg.style.height = '24px';
      homeImg.style.width = 'auto';
      homeImg.style.objectFit = 'contain';
      homeImg.style.display = 'block';

      logoContainer.appendChild(homeImg);

      logoContainer.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.open("https://danvpr.github.io/workshop/#home", "_blank");
      };
    }
  }

  function applyPixelPerfectButton() {
    applyBlackNavBar();
    applyHomeLogoButton();

    const buttons = document.querySelectorAll('a, button, [role="button"]');

    buttons.forEach(btn => {
      const isTargetButton = btn.textContent && btn.textContent.trim() === 'TurboWarp Feedback';

      if (isTargetButton || btn.dataset.danvFinalBound) {
        if (!btn.dataset.danvFinalBound) {
          btn.textContent = '';
          btn.style.minWidth = '0';

          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.gap = '6px';

          const img = document.createElement('img');
          img.src = LOGO_URL;
          img.style.height = '14px';
          img.style.width = 'auto';
          img.style.display = 'block';

          const textSpan = document.createElement('span');
          textSpan.textContent = 'Chia sẻ lên DANVworkshop';
          textSpan.style.color = '#5d41ac';
          textSpan.style.fontWeight = 'bold';
          textSpan.style.fontSize = '11px';
          textSpan.style.whiteSpace = 'nowrap';

          container.appendChild(img);
          container.appendChild(textSpan);
          btn.appendChild(container);

          btn.dataset.danvFinalBound = "true";
        }

        btn.style.backgroundColor = '#ffffff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.padding = '0px 10px';
        btn.style.height = '32px';
        btn.style.boxMaxHeight = '32px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        btn.style.transition = 'all 0.15s ease';

        btn.onmouseenter = () => { btn.style.backgroundColor = '#f3f4f6'; };
        btn.onmouseleave = () => { btn.style.backgroundColor = '#ffffff'; };

        btn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          handleUploadToWorkshop();
        };
      }
    });
  }

  applyPixelPerfectButton();
  setInterval(applyPixelPerfectButton, 400);

  class DANVPixelPerfectIntegrator {
    getInfo() {
      return {
        id: 'danvNavPixelPerfect',
        name: 'DANVworkshop',
        color1: '#0da57a',
        color2: '#0c916b',
        color3: '#086e51',
        blockIconURI: EXTENSION_ICON_URL,
        menuIconURI: EXTENSION_ICON_URL,
        blocks: [
          {
            opcode: 'noticeHatBlock',
            blockType: Scratch.BlockType.HAT,
            text: 'Gấu Gấu đây! Bạn hãy xóa khối lệnh này đi nhé.',
            isEdgeActivated: false
          }
        ]
      };
    }

    noticeHatBlock() {
      return false;
    }
  }

  Scratch.extensions.register(new DANVPixelPerfectIntegrator());
})(Scratch)