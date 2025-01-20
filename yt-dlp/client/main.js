// const API_KEY = "AIzaSyCsLO3m4MFIbkGLYPpNFmhw4OpwukUDIy4";
// let currentController = null; // İndirmeyi iptal etmek için controller

// async function searchVideos() {
//   const query = document.getElementById("search").value.trim();
//   const videoList = document.getElementById("videoList");
//   videoList.innerHTML = "";

//   if (!query) {
//     videoList.innerHTML = "<p>Lütfen bir arama terimi girin</p>";
//     return;
//   }

//   try {
//     const response = await fetch(
//       `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
//         query
//       )}&key=${API_KEY}`
//     );

//     const data = await response.json();

//     if (!data.items?.length) {
//       videoList.innerHTML = "<p>Video bulunamadı</p>";
//       return;
//     }

//     data.items.forEach((item) => {
//       const videoElement = document.createElement("div");
//       videoElement.className = "video";
//       videoElement.innerHTML = `
//                 <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
//                 <div class="video-info">
//                     <h3>${item.snippet.title}</h3>
//                     <p>${item.snippet.description}</p>
//                     <button onclick="formatlarıGetir('${item.id.videoId}')">
//                         Formatları Göster
//                     </button>
//                 </div>
//             `;
//       videoList.appendChild(videoElement);
//     });
//   } catch (error) {
//     videoList.innerHTML = "<p>Arama sırasında bir hata oluştu</p>";
//     console.error(error);
//   }
// }

// async function formatlarıGetir(videoId) {
//   const formatList = document.getElementById("formatList");
//   formatList.innerHTML = "<p>Formatlar yükleniyor...</p>";

//   try {
//     const response = await fetch("http://localhost:5000/formats", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         url: `https://www.youtube.com/watch?v=${videoId}`,
//       }),
//     });

//     const data = await response.json();

//     if (data.error) {
//       formatList.innerHTML = `<p>Hata: ${data.error}</p>`;
//       return;
//     }

//     formatList.innerHTML = `
//             <h2>MP4 Formatları</h2>
//             <div class="formats-container">
//                 ${createFormatList(data.mp4_formats, videoId, "mp4")}
//             </div>
//             <h2>MP3 Formatları</h2>
//             <div class="formats-container">
//                 ${createFormatList(data.mp3_formats, videoId, "mp3")}
//             </div>
//         `;
//   } catch (error) {
//     formatList.innerHTML = "<p>Formatlar alınırken bir hata oluştu</p>";
//     console.error(error);
//   }
// }

// function createFormatList(formats, videoId, type) {
//   if (!formats || formats.length === 0) {
//     return "<p>Format bulunamadı</p>";
//   }

//   return formats
//     .map(
//       (format) => `
//             <div class="format-item">
//                 <span class="format-info">
//                     Format ID: ${format.format_id} - Detaylar: ${format.details}
//                 </span>
//                 <button onclick="downloadVideoFromUrl('${videoId}', '${format.format_id}', '${type}')">
//                     İndir
//                 </button>
//             </div>
//         `
//     )
//     .join("");
// }

// async function getVideoTitle(videoId) {
//   try {
//     const response = await fetch(
//       `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
//     );
//     const data = await response.json();

//     if (data.items && data.items.length > 0) {
//       return data.items[0].snippet.title;
//     }
//     return "video"; // Başlık alınamazsa varsayılan ad
//   } catch (error) {
//     console.error("Başlık alınamadı:", error);
//     return "video";
//   }
// }

// // Güncellenen downloadVideoFromUrl fonksiyonu
// // async function downloadVideoFromUrl(videoId, formatId, type) {
// //     try {
// //         // Önce video başlığını al
// //         const videoTitle = await getVideoTitle(videoId);
// //         // Dosya adı için başlığı düzenle (geçersiz karakterleri kaldır)
// //         const safeTitle = videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

// //         const response = await fetch("http://localhost:5001/download", {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify({
// //                 url: `https://www.youtube.com/watch?v=${videoId}`,
// //                 format_id: formatId,
// //                 type: type,
// //                 title: safeTitle
// //             }),
// //         });

// //         if (!response.ok) {
// //             throw new Error(`HTTP error! status: ${response.status}`);
// //         }

// //         const blob = await response.blob();
// //         const downloadUrl = window.URL.createObjectURL(blob);
// //         const a = document.createElement('a');
// //         a.href = downloadUrl;
// //         a.download = `${safeTitle}.${type}`; // Video başlığını kullan
// //         document.body.appendChild(a);
// //         a.click();
// //         document.body.removeChild(a);
// //         window.URL.revokeObjectURL(downloadUrl);

// //     } catch (error) {
// //         console.error("İndirme sırasında bir hata oluştu:", error);
// //         alert("İndirme sırasında bir hata oluştu: " + error.message);
// //     }
// // }

// async function downloadVideoFromUrl(videoId, formatId, type) {
//   try {
//     // Daha önceki indirme devam ediyorsa iptal et
//     if (currentController) {
//       currentController.abort();
//     }

//     const videoTitle = await getVideoTitle(videoId);
//     const safeTitle = videoTitle.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");

//     // Progress bar'ı göster ve sıfırla
//     const progressContainer = document.getElementById("progressContainer");
//     const progressBar = document.getElementById("progressBar");
//     const progressText = document.getElementById("progressText");
//     progressContainer.style.display = "block";
//     progressBar.style.width = "0%";
//     progressText.textContent = "İndirme başlıyor...";

//     // Yeni controller oluştur
//     currentController = new AbortController();
//     const signal = currentController.signal;

//     const response = await fetch("http://localhost:5001/download", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         url: `https://www.youtube.com/watch?v=${videoId}`,
//         format_id: formatId,
//         type: type,
//         title: safeTitle,
//       }),
//       signal,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     // Response'un boyutunu al
//     const contentLength = response.headers.get("Content-Length");
//     const total = parseInt(contentLength, 10);
//     let loaded = 0;

//     // Response'u stream olarak oku
//     const reader = response.body.getReader();
//     const chunks = [];

//     while (true) {
//       const { done, value } = await reader.read();

//       if (done) break;

//       chunks.push(value);
//       loaded += value.length;

//       // İlerlemeyi güncelle
//       const progress = (loaded / total) * 100;
//       progressBar.style.width = `${progress}%`;
//       progressText.textContent = `İndiriliyor... ${Math.round(progress)}%`;

//       // Animasyon hızını artır
//       if (progress > 95) {
//         progressBar.style.transition = "width 0.1s ease";
//       } else {
//         progressBar.style.transition = "width 0.3s ease";
//       }
//     }

//     // Chunks'ları birleştir ve indir
//     const blob = new Blob(chunks);
//     const downloadUrl = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = downloadUrl;
//     a.download = `${safeTitle}.${type}`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(downloadUrl);

//     // İndirme tamamlandı
//     progressText.textContent = "İndirme tamamlandı!";
//     setTimeout(() => {
//       progressContainer.style.display = "none";
//     }, 2000);
//   } catch (error) {
//     if (error.name === "AbortError") {
//       progressText.textContent = "İndirme iptal edildi";
//     } else {
//       console.error("İndirme sırasında bir hata oluştu:", error);
//       progressText.textContent = "İndirme sırasında hata oluştu";
//       alert("İndirme sırasında bir hata oluştu: " + error.message);
//     }
//   } finally {
//     currentController = null;
//     setTimeout(() => {
//       progressContainer.style.display = "none";
//     }, 2000);
//   }
// }

// function cancelDownload() {
//   if (currentController) {
//     currentController.abort();
//     currentController = null;
//   }
// }

const API_KEY = "AIzaSyCsLO3m4MFIbkGLYPpNFmhw4OpwukUDIy4";
const API_TIMEOUT = 30000; // 30 seconds
let currentController = null;

async function searchVideos() {
  const query = document.getElementById("search").value.trim();
  const videoList = document.getElementById("videoList");
  videoList.innerHTML = "";

  if (!query) {
    videoList.innerHTML = "<p>Lütfen bir arama terimi girin</p>";
    return;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items?.length) {
      videoList.innerHTML = "<p>Video bulunamadı</p>";
      return;
    }

    data.items.forEach((item) => {
      const videoElement = document.createElement("div");
      videoElement.className = "video";
      videoElement.innerHTML = `
        <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
        <div class="video-info">
          <h3>${item.snippet.title}</h3>
          <p>${item.snippet.description}</p>
          <button onclick="formatlarıGetir('${item.id.videoId}')">
            Formatları Göster
          </button>
        </div>
      `;
      videoList.appendChild(videoElement);
    });
  } catch (error) {
    videoList.innerHTML = "<p>Arama sırasında bir hata oluştu</p>";
    console.error(error);
  }
}

async function formatlarıGetir(videoId) {
  const formatList = document.getElementById("formatList");
  formatList.innerHTML = "<p>Formatlar yükleniyor...</p>";

  try {
    const response = await fetch("/api/v1/formats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }),
    });

    if (response.status === 404) {
      formatList.innerHTML = "<p>API endpoint bulunamadı</p>";
      return;
    }

    if (response.status === 500) {
      formatList.innerHTML = "<p>Sunucu hatası oluştu</p>";
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "error") {
      formatList.innerHTML = `<p>Hata: ${data.message}</p>`;
      return;
    }

    formatList.innerHTML = `
      <h2>MP4 Formatları</h2>
      <div class="formats-container">
        ${createFormatList(data.mp4_formats, videoId, "mp4")}
      </div>
      <h2>MP3 Formatları</h2>
      <div class="formats-container">
        ${createFormatList(data.mp3_formats, videoId, "mp3")}
      </div>
    `;
  } catch (error) {
    formatList.innerHTML = `<p>Formatlar alınırken bir hata oluştu: ${error.message}</p>`;
    console.error(error);
  }
}

function createFormatList(formats, videoId, type) {
  if (!formats || formats.length === 0) {
    return "<p>Format bulunamadı</p>";
  }

  return formats
    .map(
      (format) => `
        <div class="format-item">
          <span class="format-info">
            Format ID: ${format.format_id} - Detaylar: ${format.details}
          </span>
          <button onclick="downloadVideoFromUrl('${videoId}', '${format.format_id}', '${type}')">
            İndir
          </button>
        </div>
      `
    )
    .join("");
}

async function getVideoTitle(videoId) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.title;
    }
    return "video";
  } catch (error) {
    console.error("Başlık alınamadı:", error);
    return "video";
  }
}

async function downloadVideoFromUrl(videoId, formatId, type) {
  try {
    if (currentController) {
      currentController.abort();
    }

    const videoTitle = await getVideoTitle(videoId);
    const safeTitle = videoTitle.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");

    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "İndirme başlıyor...";

    currentController = new AbortController();
    const timeoutId = setTimeout(() => currentController.abort(), API_TIMEOUT);

    try {
      const response = await fetch("/api/v1/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          format_id: formatId,
          type: type,
          title: safeTitle,
        }),
        signal: currentController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "İndirme başarısız oldu");
      }

      // Blob olarak yanıtı al
      const blob = await response.blob();

      // İndirme URL'si oluştur
      const downloadUrl = window.URL.createObjectURL(blob);

      // İndirme bağlantısı oluştur ve tıkla
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${safeTitle}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // URL'yi temizle
      window.URL.revokeObjectURL(downloadUrl);

      progressText.textContent = "İndirme tamamlandı!";
      progressBar.style.width = "100%";
    } catch (error) {
      if (error.name === "AbortError") {
        progressText.textContent = "İndirme iptal edildi";
      } else {
        progressText.textContent = `İndirme hatası: ${error.message}`;
        console.error("İndirme hatası:", error);
      }
      progressBar.style.width = "0%";
    } finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        progressContainer.style.display = "none";
      }, 2000);
    }
  } catch (error) {
    console.error("Hata:", error);
    alert("İndirme sırasında bir hata oluştu: " + error.message);
  } finally {
    currentController = null;
  }
}

function cancelDownload() {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
}
