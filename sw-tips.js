/**
 * Chrome 확장프로그램의 '오늘의 팁' 기능을 관리하는 스크립트
 * 매일 새로운 팁을 가져와서 저장하고, 컨텐츠 스크립트의 요청에 응답합니다.
 */

console.log("sw-tips.js");

/**
 * 서버에서 팁을 가져와 로컬 스토리지에 저장합니다.
 * @async
 * @returns {Promise} chrome.storage.local.set의 Promise 객체
 */
const updateTip = async () => {
  // 외부 API에서 팁 목록을 가져옴
  const response = await fetch("https://extension-tips.glitch.me/tips.json");
  const tips = await response.json();
  // 랜덤한 팁을 선택
  const randomIndex = Math.floor(Math.random() * tips.length);
  // 선택된 팁을 로컬 스토리지에 저장
  return chrome.storage.local.set({ tip: tips[randomIndex] });
};

/** 알람 식별자로 사용될 상수 */
const ALARM_NAME = "tip";

/**
 * 매일 팁을 업데이트하기 위한 알람을 생성합니다.
 * 브라우저 세션이 재시작될 때 알람이 제거될 수 있으므로,
 * 알람이 없을 때만 새로 생성합니다.
 * @async
 */
async function createAlarm() {
  const alarm = await chrome.alarms.get(ALARM_NAME);
  if (typeof alarm === "undefined") {
    // 1분 후에 시작하여 24시간(1440분)마다 반복되는 알람 생성
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 1,
      periodInMinutes: 1440,
    });
    updateTip();
  }
}

// 초기 알람 생성
createAlarm();

/**
 * 알람이 울릴 때마다 새로운 팁으로 업데이트
 * @listens chrome.alarms.onAlarm
 */
chrome.alarms.onAlarm.addListener(updateTip);

/**
 * 컨텐츠 스크립트로부터의 메시지를 처리합니다.
 * 'tip' 메시지를 받으면 현재 저장된 팁을 응답으로 전송합니다.
 * @listens chrome.runtime.onMessage
 * @param {Object} message - 수신된 메시지 객체
 * @param {Object} sender - 메시지를 보낸 발신자 정보
 * @param {function} sendResponse - 응답을 보내는 콜백 함수
 * @returns {boolean} true - 비동기 응답을 사용함을 나타냄
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.greeting === "tip") {
    chrome.storage.local.get("tip").then(sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
});
