
// main.js

const keywordCheckboxes = document.querySelectorAll(".keyword");
const includeHard = document.getElementById("includeHard");
const onlyFusion = document.getElementById("onlyFusion");
const onlyLimited = document.getElementById("onlyLimited");
const showAllByKeyword = document.getElementById("showAllByKeyword");
const resultsSection = document.getElementById("results");

let allGifts = [];

fetch("data/ego_gifts.json")
  .then((res) => res.json())
  .then((data) => {
    allGifts = data;
    attachFilterEvents();
    updateDisplay();
  });

function attachFilterEvents() {
  keywordCheckboxes.forEach(cb => cb.addEventListener("change", updateDisplay));
  includeHard.addEventListener("change", updateDisplay);
  onlyFusion.addEventListener("change", updateDisplay);
  onlyLimited.addEventListener("change", updateDisplay);
  showAllByKeyword.addEventListener("change", () => {
    const disabled = showAllByKeyword.checked;
    includeHard.disabled = disabled;
    onlyFusion.disabled = disabled;
    onlyLimited.disabled = disabled;
    updateDisplay();
  });
}

function updateDisplay() {
  const selectedKeywords = Array.from(keywordCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (selectedKeywords.length === 0) {
    resultsSection.innerHTML = "<p>키워드를 하나 이상 선택해주세요.</p>";
    return;
  }

  if (showAllByKeyword.checked) {
    const filtered = allGifts.filter(gift =>
      selectedKeywords.some(k =>
        (gift.category && gift.category === k) ||
        (gift.keywords && gift.keywords.includes(k))
      )
    );
    renderKeywordAllResults(filtered);
    return;
  }

  const fusionFiltered = allGifts
    .filter(gift => selectedKeywords.some(k =>
      (gift.category && gift.category === k) ||
      (gift.keywords && gift.keywords.includes(k))
    ))
    .filter(gift => gift.is_fusion_only)
    .filter(gift => includeHard.checked || !gift.is_hard_only);

  renderResults(fusionFiltered, selectedKeywords);
}

function renderKeywordAllResults(gifts) {
  resultsSection.innerHTML = "";
  const section = document.createElement("div");
  section.innerHTML = `<h3>🔍 선택 키워드 전체 보기 결과</h3>`;
  for (const gift of gifts) {
    const div = document.createElement("div");
    div.className = "gift-card";
    div.innerHTML = renderGiftTree(gift);
    section.appendChild(div);
  }
  resultsSection.appendChild(section);
}

function renderResults(gifts, selectedKeywords) {
  resultsSection.innerHTML = "";

  if (gifts.length === 0) {
    resultsSection.innerHTML = "<p>조건에 맞는 결과가 없습니다.</p>";
    return;
  }

  
  const fusionSection = document.createElement("div");
  fusionSection.innerHTML = `<h3>🔧 조합식 EGO 기프트</h3>`;
  const grid = document.createElement("div");
  grid.className = "card-grid";

  fusionSection.innerHTML = `<h3>🔧 조합식 EGO 기프트</h3>`;
  for (const gift of gifts) {
    const div = document.createElement("div");
    div.className = "gift-card";
    div.innerHTML = renderGiftTree(gift);
    grid.appendChild(div);
  }
  fusionSection.appendChild(grid);
  resultsSection.appendChild(fusionSection);

  if (onlyLimited.checked) {
    const limitedList = allGifts.filter(g =>
      g.is_card_pack_only &&
      !g.is_fusion_only &&
      selectedKeywords.some(k =>
        (g.category && g.category === k) ||
        (g.keywords && g.keywords.includes(k))
      )
    );
    if (limitedList.length > 0) {
      const limSec = document.createElement("div");
      limSec.innerHTML = `<h3>🎴 카드팩 한정 기프트</h3>`;
      for (const g of limitedList) {
        const div = document.createElement("div");
        div.className = "gift-card";
        div.innerHTML = renderGiftTree(g);
        limSec.appendChild(div);
      }
      resultsSection.appendChild(limSec);
    }
  }
}

function renderGiftTree(gift, depth = 0) {
  const pad = '&nbsp;'.repeat(depth * 4);
  const imgName = encodeURIComponent(gift.item_name) + ".WEBP";
  
  let tags = [];
  if (gift.is_card_pack_only && gift.is_fusion_only) {
    tags.push('<span class="tag card-tag-both">한정+합성</span>');
  } else {
    if (gift.is_card_pack_only) tags.push('<span class="tag card-tag-pack">한정</span>');
    if (gift.is_fusion_only) tags.push('<span class="tag card-tag-fusion">합성</span>');
  }
  if (gift.is_hard_only) tags.push('<span class="tag card-tag-hard">하드</span>');

  let html = `<div>${pad}<img src="img/${imgName}" alt="${gift.item_name}" width="48" height="48"> 
  <strong>${gift.item_name}</strong> ${tags.join(" ")}</div>`;


  if (gift.ingredients && gift.ingredients.length > 0) {
    const children = gift.ingredients.map(ingName => {
      const child = allGifts.find(g => g.item_name === ingName);
      return child ? renderGiftTree(child, depth + 1) : `<div>${'&nbsp;'.repeat((depth + 1) * 4)}<img src="img/${encodeURIComponent(ingName)}.WEBP" alt="${ingName}" width="36" height="36"> ${ingName}</div>`;
    });
    html += children.join("");
  }

  
  if (gift.is_card_pack_only && gift.card_pack_name) {
    const packImgName = "card_pack_" + encodeURIComponent(gift.card_pack_name) + ".webp";
    html = html.replace("</strong>", `</strong>
      <span class="card-pack-inline">
        <span class="arrow">→</span>
        <img src="img/${packImgName}" class="pack-icon" alt="${gift.card_pack_name}">
        <span class="pack-name">${gift.card_pack_name}</span>
      </span>`);
  }
  return html;

}
