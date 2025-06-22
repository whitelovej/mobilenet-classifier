let mobilenetModel;
let webcamElement = document.getElementById('webcam');
let resultElement = document.getElementById('result');
let predictButton = document.getElementById('predict-button');
let captureButton = document.getElementById('capture-button');
let labelInput = document.getElementById('label-input');

// 暫存特徵與標籤
const trainingData = [];
const trainingLabels = [];
const labelSet = new Set();
let trainedModel = null;

// 初始化鏡頭（使用後鏡頭）
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
      audio: false
    });
    webcamElement.srcObject = stream;
    return new Promise((resolve) => {
      webcamElement.onloadedmetadata = () => {
        resolve();
      };
    });
  } catch (err) {
    alert('無法開啟鏡頭：' + err.message);
    console.error(err);
  }
}

// 初始化 MobileNet（作為特徵提取器）
async function loadMobilenet() {
  const model = await mobilenet.load({ version: 2, alpha: 1.0 });
  return model;
}

// 擷取畫面 → 特徵張量（透過 MobileNet）
function captureFeature() {
  const tfImg = tf.browser.fromPixels(webcamElement).resizeBilinear([224, 224]).toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
  const batched = tfImg.expandDims(0);
  return mobilenetModel.infer(batched, true); // 取得 feature embeddings
}

// 擷取樣本並記錄
function captureExample() {
  const label = labelInput.value.trim();
  if (!label) {
    alert('請輸入分類名稱');
    return;
  }
  const features = captureFeature();
  trainingData.push(features);
  trainingLabels.push(label);
  labelSet.add(label);
  resultElement.innerHTML = `<h1>已加入樣本：${label}（共 ${trainingLabels.length} 張）</h1>`;
}

// 建立與訓練模型
async function trainModel() {
  if (trainingData.length < 2) {
    alert("請至少加入 2 張樣本");
    return;
  }

  // 建立 Label 對應編號
  const labelsArray = Array.from(labelSet);
  const labelToIndex = {};
  labelsArray.forEach((l, i) => { labelToIndex[l] = i; });

  const xs = tf.concat(trainingData);
  const ys = tf.tensor1d(trainingLabels.map(label => labelToIndex[label]), 'int32');
  const ysOneHot = tf.oneHot(ys, labelsArray.length);

  // 建立模型
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [xs.shape[1]], units: 100, activation: 'relu' }));
  model.add(tf.layers.dense({ units: labelsArray.length, activation: 'softmax' }));

  model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: ['accuracy'] });

  resultElement.innerHTML = `<h1>🚀 訓練中...</h1>`;
  await model.fit(xs, ysOneHot, {
    epochs: 20,
    batchSize: 8,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        resultElement.innerHTML = `<h1>訓練中：第 ${epoch + 1} 回合，準確度 ${(logs.acc * 100).toFixed(1)}%</h1>`;
      }
    }
  });

  trainedModel = model;
  resultElement.innerHTML = `<h1>✅ 模型訓練完成，可進行辨識</h1>`;

  // 清除 memory
  xs.dispose();
  ys.dispose();
  ysOneHot.dispose();
}

// 預測自訂分類
async function predictCustom() {
  if (!trainedModel) {
    alert("尚未訓練模型");
    return;
  }

  const feature = captureFeature();
  const prediction = trainedModel.predict(feature);
  const classIndex = prediction.argMax(-1).dataSync()[0];
  const labelsArray = Array.from(labelSet);
  const label = labelsArray[classIndex];
  const confidence = prediction.dataSync()[classIndex];

  resultElement.innerHTML = `<h1>辨識結果：${label}（信心值：${(confidence * 100).toFixed(2)}%）</h1>`;
}

async function main() {
  await setupCamera();
  mobilenetModel = await loadMobilenet();
  resultElement.innerText = "📥 MobileNet 模型已載入，準備拍照收集樣本";
}

// 事件綁定
captureButton.addEventListener('click', captureExample);
predictButton.addEventListener('click', async () => {
  if (!trainedModel) {
    await trainModel();
  } else {
    await predictCustom();
  }
});

main();
