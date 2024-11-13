/**
 * Chrome 확장프로그램의 옴니박스(주소창) 기능을 관리하는 스크립트
 * 사용자가 Chrome 주소창에서 특정 키워드를 입력하면 Chrome API 문서로 빠르게 이동할 수 있게 해줍니다.
 * 최근 검색한 API들을 저장하고 추천 검색어로 보여줍니다.
 */

console.log("sw-omnibox.js");

/**
 * 확장프로그램이 처음 설치될 때 기본 API 추천 목록을 초기화합니다.
 * @listens chrome.runtime.onInstalled
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.storage.local.set({
      apiSuggestions: ["tabs", "storage", "scripting"],
    });
  }
});

/** Chrome 확장프로그램 API 문서의 기본 URL */
const URL_CHROME_EXTENSIONS_DOC =
  "https://developer.chrome.com/docs/extensions/reference/";

/** 저장할 최근 검색어의 최대 개수 */
const NUMBER_OF_PREVIOUS_SEARCHES = 4;

/**
 * 사용자가 옴니박스에 텍스트를 입력할 때마다 추천 검색어를 표시합니다.
 * @listens chrome.omnibox.onInputChanged
 * @param {string} input - 사용자가 입력한 텍스트
 * @param {function} suggest - 추천 검색어를 표시하는 콜백 함수
 */
chrome.omnibox.onInputChanged.addListener(async (input, suggest) => {
  await chrome.omnibox.setDefaultSuggestion({
    description: "Enter a Chrome API or choose from past searches",
  });
  const { apiSuggestions } = await chrome.storage.local.get("apiSuggestions");
  const suggestions = apiSuggestions.map((api) => {
    return { content: api, description: `Open chrome.${api} API` };
  });
  suggest(suggestions);
});

/**
 * 사용자가 추천 검색어를 선택하면 해당 API의 문서 페이지를 새 탭에서 엽니다.
 * @listens chrome.omnibox.onInputEntered
 * @param {string} input - 선택된 API 이름
 */
chrome.omnibox.onInputEntered.addListener((input) => {
  chrome.tabs.create({ url: URL_CHROME_EXTENSIONS_DOC + input });
  // 최근 검색어 목록 업데이트
  updateHistory(input);
});

/**
 * 최근 검색한 API 목록을 업데이트합니다.
 * @param {string} input - 저장할 API 이름
 * @returns {Promise} storage.local.set의 Promise 객체
 */
async function updateHistory(input) {
  const { apiSuggestions } = await chrome.storage.local.get("apiSuggestions");
  apiSuggestions.unshift(input); // 새로운 검색어를 배열 앞에 추가
  apiSuggestions.splice(NUMBER_OF_PREVIOUS_SEARCHES); // 최대 개수만큼만 유지
  return chrome.storage.local.set({ apiSuggestions });
}
