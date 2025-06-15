let net;
const webcamElement = document.getElementById('webcam');
const resultElement = document.getElementById('result');
const predictButton = document.getElementById('predict-button');

// 🔹 初始化鏡頭（使用後鏡頭）
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },  // 改成後鏡頭
      audio: false
    });
    webcamElement.srcObject = stream;
    return new Promise(resolve => {
      webcamElement.onloadedmetadata = () => {
        resolve();
      };
    });
  } catch (err) {
    alert("無法開啟鏡頭：" + err.message);
    console.error(err);
  }
}

// 🔹 預測物件類別
async function predict() {
  alert("test");
  const result = await net.classify(webcamElement);
  if (result.length > 0) {
    resultElement.innerText = `辨識結果：${result[0].className}（信心值：${(result[0].probability * 100).toFixed(2)}%）`;
  } else {
    resultElement.innerText = "無法辨識";
  }
}

// 🔹 主流程
async function main() {
  await setupCamera();  // 開啟鏡頭
  net = await mobilenet.load(); // 載入模型
  resultElement.innerText = "模型已載入，準備辨識";

  // 加入按鈕事件
  predictButton.addEventListener('click', predict);
}

main();
