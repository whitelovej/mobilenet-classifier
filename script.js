let net;
const webcamElement = document.getElementById('webcam');
const resultElement = document.getElementById('result');
const predictButton = document.getElementById('predict-button');

// 🔹 初始化鏡頭（使用後鏡頭）
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
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

// 🔹 翻譯英文到繁體中文
async function translateLabel(span) {
  const text = span.innerText;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const zh = data[0]?.[0]?.[0] || '翻譯失敗';

    const translationElement = document.createElement('p');
    translationElement.innerText = `翻譯：${zh}`;
    translationElement.style.fontSize = '18px';
    translationElement.style.marginTop = '10px';
    translationElement.style.color = '#333';

    resultElement.appendChild(translationElement);
  } catch (e) {
    alert("翻譯失敗：" + e.message);
    console.error(e);
  }
}

// 🔹 預測物件類別
async function predict() {
  const result = await net.classify(webcamElement);
  if (result.length > 0) {
    const label = result[0].className;
    const prob = (result[0].probability * 100).toFixed(2);

    resultElement.innerHTML = `
      <h1>
        辨識結果：
        <span 
          onclick="translateLabel(this)" 
          style="color:blue; text-decoration:underline; cursor:pointer;"
        >${label}</span>
        （信心值：${prob}%）
      </h1>
    `;
  } else {
    resultElement.innerHTML = "<h1>無法辨識</h1>";
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
