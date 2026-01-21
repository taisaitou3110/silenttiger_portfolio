// HTML要素への参照を取得
const searchBtn = document.getElementById('search-btn');
const zipcodeEl = document.getElementById('zipcode');
const resultArea = document.getElementById('result-area');
const historyList = document.getElementById('history-list');

// APIのベースURL
const API_URL = 'https://zipcloud.ibsnet.co.jp/api/search';

// 検索履歴を保存する配列
let searchHistory = [];

// 履歴をレンダリングする関数
function renderHistory() {
    historyList.innerHTML = '';
    for (const item of searchHistory) {
        const li = document.createElement('li');
        li.textContent = `〒${item.zipcode}: ${item.address}`;
        historyList.appendChild(li);
    }
}

// sessionStorageから履歴を読み込む
function loadHistory() {
    const history = sessionStorage.getItem('searchHistory');
    if (history) {
        searchHistory = JSON.parse(history);
        renderHistory();
    }
}

// 履歴をsessionStorageに保存する
function saveHistory() {
    sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

// 検索ボタンがクリックされたときの処理
searchBtn.addEventListener('click', async () => {
    // 入力された郵便番号を取得
    const zipcode = zipcodeEl.value;

    // 郵便番号が入力されていない場合は処理を中断
    if (!zipcode) {
        resultArea.innerHTML = '<p style="color: red;">郵便番号を入力してください。</p>';
        return;
    }

    // APIリクエスト用のURLを構築
    const requestUrl = `${API_URL}?zipcode=${zipcode}`;
    
    // 検索中の表示
    resultArea.innerHTML = '<p>検索中...</p>';

    try {
        // APIにリクエストを送信し、レスポンスを取得
        const response = await fetch(requestUrl);

        // レスポンスをJSONとして解析
        const data = await response.json();

        // 結果を画面に表示
        if (data.status === 200 && data.results) {
            // 住所情報を連結
            const address = data.results[0];
            const fullAddress = `${address.address1} ${address.address2} ${address.address3}`;
            resultArea.innerHTML = `<p>${fullAddress}</p>`;

            // 履歴に追加
            searchHistory.unshift({ zipcode, address: fullAddress });
            if (searchHistory.length > 10) {
                searchHistory.pop();
            }
            renderHistory();
            saveHistory();

        } else {
            // エラーメッセージを表示
            resultArea.innerHTML = `<p style="color: red;">住所が見つかりませんでした。郵便番号を確認してください。（${data.message || ''}）</p>`;
        }
    } catch (error) {
        // 通信エラー時の処理
        console.error('APIリクエスト中にエラーが発生しました:', error);
        resultArea.innerHTML = '<p style="color: red;">通信エラーが発生しました。時間をおいて再度お試しください。</p>';
    } finally {
        zipcodeEl.value = ''; // 入力フィールドをクリア
        zipcodeEl.focus();    // 入力フィールドにフォーカスを戻す
    }
});

// ページ読み込み時に履歴を読み込む
loadHistory();