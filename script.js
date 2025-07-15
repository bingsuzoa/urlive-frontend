// DOM 요소들
import { fetchUserUrls, createShortUrl } from './api.js';
const urlForm = document.getElementById('urlForm');
const originalUrlInput = document.getElementById('originalUrl');
const resultContainer = document.getElementById('resultContainer');
const shortUrlInput = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const originalUrlDisplay = document.getElementById('originalUrlDisplay');
const createdDateDisplay = document.getElementById('createdDate');
const urlHistory = document.getElementById('urlHistory');
const loadingSpinner = document.getElementById('loadingSpinner');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const userNameElement = document.getElementById('userName');

// 헤더 버튼
const logoutBtn = document.getElementById('logoutBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');

// 로컬 스토리지에서 URL 히스토리 불러오기
let urlHistoryData = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    
    // 단축 URL 리다이렉션 처리
    handleShortUrlRedirect();
    
    // 로그인 상태 확인 (리다이렉트 없이)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('authToken');
    
    if (!isLoggedIn || !token) {
        console.log('로그인되지 않음 - 로그인 페이지로 이동');
        window.location.href = '/login.html';
        return;
    }
    
    // 사용자 정보 표시
    displayUserInfo();
    
    // 서버에서 URL 목록 가져오기
    loadAndDisplayUserUrls();

    // 헤더 버튼 이벤트 리스너 등록
    logoutBtn.addEventListener('click', handleLogout);
    changePasswordBtn.addEventListener('click', showChangePasswordModal);
    urlHistory.addEventListener('click', handleHistoryActions);
});


// 서버에서 사용자의 URL 목록 가져오기
async function loadAndDisplayUserUrls() {
    try {
        const userId = localStorage.getItem('userId');
        const rawUrls = await fetchUserUrls(userId); // api.js의 함수 호출

        // 서버 데이터를 UI에 맞는 형태로 가공
        const serverUrls = rawUrls.map(item => ({
            id: item.id,
            originalUrl: item.originalUrl,
            shortUrl: `http://localhost:8080/${item.shortUrl}`,
            title: item.title || '제목 없음',
            createdAt: item.createdAt,
            viewCount: item.viewCount || 0
        }));
        
        console.log("🧪 변환된 서버 URL 데이터:", serverUrls);
        
        // 전역 상태 및 로컬 스토리지 업데이트
        urlHistoryData = serverUrls;
        localStorage.setItem('urlHistory', JSON.stringify(urlHistoryData));
        
        // UI 업데이트
        displayUrlHistory();
        
        console.log(`${serverUrls.length}개의 URL을 서버에서 로드했습니다.`);
 } catch (error) {
        console.error('URL 목록 로드 오류:', error);
        showNotification('서버 연결에 실패했습니다.', 'error');
        showNotification(error.message, 'error');
    }
}

// 로그아웃 처리
function handleLogout() {
    // 로컬 스토리지 클리어
    localStorage.clear();
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login.html';
}

// 단축 URL 리다이렉션 처리
function handleShortUrlRedirect() {
    const path = window.location.pathname;
    
    // 루트 경로가 아니고, 파일 확장자가 없는 경우 단축 URL로 간주
    if (path !== '/' && !path.includes('.')) {
        const shortUrlCode = path.substring(1); // 앞의 '/' 제거
        
        if(shortUrlCode) {
            window.location.href = `http://localhost:8080/${shortUrlCode}`;
        }
    }
}

// 인증 상태 확인
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('authToken');
    
    if (!isLoggedIn || !token) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        window.location.href = '/login.html';
        return;
    }
}

// 사용자 정보 표시
function displayUserInfo() {
    const userName = localStorage.getItem('userName');
    const userData = localStorage.getItem('userData');
    
    if (userName && userNameElement) {
        userNameElement.textContent = userName;
    } else if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.name && userNameElement) {
                userNameElement.textContent = user.name;
            }
        } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
        }
    }
}

// URL 단축 폼 제출 이벤트
urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const originalUrl = originalUrlInput.value.trim();
    
    if (!isValidUrl(originalUrl)) {
        showNotification('올바른 URL을 입력해주세요.', 'error');
        return;
    }
    
    await shortenUrl(originalUrl);
});

// URL 복사 버튼 이벤트
copyBtn.addEventListener('click', () => {
    copyToClipboard(shortUrlInput.value);
});

// URL 유효성 검사
function isValidUrl(string) {
    // 서버의 정규식 패턴과 동일하게 검증
    const urlPattern = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    return urlPattern.test(string);
}


// 결과 표시
function displayResult(originalUrl, shortUrl, title, createdAt, viewCount) {
    shortUrlInput.value = shortUrl;
    document.getElementById('urlTitle').textContent = title || '제목 없음';
    originalUrlDisplay.textContent = originalUrl;
    createdDateDisplay.textContent = new Date(createdAt).toLocaleString('ko-KR');
    document.getElementById('viewCount').textContent = viewCount || 0;
    
    resultContainer.classList.remove('hidden');
    
    // 결과 컨테이너로 스크롤
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// 히스토리에 추가
function addToHistory(entry) {
    // 중복 제거 (같은 원본 URL이 있으면 제거)
    urlHistoryData = urlHistoryData.filter(e => e.originalUrl !== entry.originalUrl);
    
    // 새 항목을 맨 앞에 추가
    urlHistoryData.unshift(entry);
    
    // 최대 10개까지만 유지
    if (urlHistoryData.length > 10) {
        urlHistoryData = urlHistoryData.slice(0, 10);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('urlHistory', JSON.stringify(urlHistoryData));
    
    // UI 업데이트
    displayUrlHistory();
}

// URL 히스토리 표시
function displayUrlHistory() {
    
    // DOM 요소를 다시 찾기
    const urlHistoryElement = document.getElementById('urlHistory');
    
    if (!urlHistoryElement) {
        return;
    }
    
    if (urlHistoryData.length === 0) {
        urlHistoryElement.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">아직 단축된 URL이 없습니다.</p>';
        return;
    }
    
    urlHistoryElement.innerHTML = urlHistoryData.map(entry => {
        return `
        <div class="history-item" data-id="${entry.id}">
            <div class="history-content">
                <div class="history-title">
                    <span id="title-${entry.id}">${entry.title}</span>
                    <button class="edit-title-btn" data-action="edit-title" title="제목 수정">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="history-urls">
                    <div class="original-url">${truncateUrl(entry.originalUrl, 50)}</div>
                    <div class="short-url" data-short-url="${entry.shortUrl}">${entry.shortUrl}</div>
                </div>
                <div class="history-meta">
                    <span class="created-date">${new Date(entry.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span class="view-count">조회수: ${entry.viewCount}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-btn" data-action="insights" title="통계 보기">
                    <i class="fas fa-chart-bar"></i>
                </button>
                <button class="history-btn" data-action="copy" title="복사">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="history-btn" data-action="open" title="열기">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="history-btn" data-action="delete" title="삭제">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

// URL 히스토리 액션 처리 (이벤트 위임)
function handleHistoryActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const historyItem = button.closest('.history-item');
    const userUrlId = Number(historyItem.dataset.id);
    const fullShortUrl = historyItem.querySelector('.short-url').dataset.shortUrl;
    console.log(fullShortUrl); // 기대하는 값인지 확인
    

    const entry = urlHistoryData.find(item => item.id === userUrlId);
    if (!entry) return;

    switch (action) {
        case 'copy':
            copyToClipboard(entry.shortUrl);
            break;
        case 'open':
            openUrl(entry.shortUrl);
            break;
        case 'delete':
            // 사용자에게 삭제 여부를 한 번 더 확인
            if (confirm('정말로 이 URL을 삭제하시겠습니까?')) {
                deleteFromHistory(userUrlId);
            }
            break;
        case 'edit-title':
            showEditTitleModal(userUrlId, entry.title);
            break;
        case 'insights':
            const shortUrlCode = fullShortUrl.split('/').pop();
            window.location.href = `/insight.html?shortUrlCode=${shortUrlCode}`;
            break;
        default:
            console.warn('알 수 없는 액션:', action);
    }
}

// URL 자르기 함수
function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

// 클립보드에 복사
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('클립보드에 복사되었습니다!', 'success');
    } catch (err) {
        // 폴백 방법
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('클립보드에 복사되었습니다!', 'success');
    }
}

// URL 열기
function openUrl(shortUrl) {
    window.open(shortUrl, '_blank');
}

// 히스토리에서 삭제
async function deleteFromHistory(userUrlId) {
    console.log("🧪 deleteFromHistory 호출됨, userUrlId:", userUrlId);
    try {
        const url = `http://localhost:8080/user-urls/${userUrlId}`;
        console.log("🧪 API 요청 URL:", url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("🧪 서버 응답 상태:", response.status);
        const data = await response.json();
        console.log("🧪 서버 응답 데이터:", data);
        
        if (response.ok) {
            // 서버에서 삭제 성공 시 로컬 데이터도 업데이트
            urlHistoryData = urlHistoryData.filter(entry => entry.id !== userUrlId);
            localStorage.setItem('urlHistory', JSON.stringify(urlHistoryData));
            displayUrlHistory();
            showNotification('항목이 삭제되었습니다.', 'success');
        } else {
            // 서버에서 에러 응답이 온 경우
            console.error('URL 삭제 실패:', data.message);
            showNotification(data.message || '삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('URL 삭제 오류:', error);
        showNotification('서버 연결에 실패했습니다.', 'error');
    }
}

// 로딩 스피너 표시/숨김
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// 알림 표시
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// 입력 필드 포커스 시 자동 선택
originalUrlInput.addEventListener('focus', () => {
    originalUrlInput.select();
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter로 폼 제출
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        urlForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape로 결과 숨김
    if (e.key === 'Escape') {
        resultContainer.classList.add('hidden');
    }
});

// 페이지 새로고침 시 입력 필드 초기화
window.addEventListener('beforeunload', () => {
    originalUrlInput.value = '';
});

// URL 단축 하기 
async function shortenUrl(originalUrl) {
    showLoading(true);
    try {
        const userId = localStorage.getItem('userId');
        const newUrlData = await createShortUrl(userId, originalUrl);

        // 서버 응답 데이터를 UI에 맞는 형태로 가공
        const newEntry = {
            id: newUrlData.id,
            originalUrl: newUrlData.originalUrl,
            shortUrl: `http://localhost:8080/${newUrlData.shortUrl}`,
            title: newUrlData.title || '제목 없음',
            createdAt: newUrlData.createdAt,
            viewCount: newUrlData.viewCount || 0
        };

        displayResult(newEntry.originalUrl, newEntry.shortUrl, newEntry.title, newEntry.createdAt, newEntry.viewCount);
        addToHistory(newEntry);
        originalUrlInput.value = ''; // 입력 필드 초기화
        showNotification('URL이 성공적으로 단축되었습니다!', 'success');

    } catch (error) {
        console.error('URL 단축 오류:', error);
        showNotification(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 통계 정보 (선택사항)
function getStats() {
    const totalUrls = urlHistoryData.length;
    const today = new Date().toDateString();
    const todayUrls = urlHistoryData.filter(entry => 
        new Date(entry.createdAt).toDateString() === today
    ).length;
    
    return {
        total: totalUrls,
        today: todayUrls
    };
}

// 디버깅용 콘솔 로그
console.log('URLive 대시보드가 로드되었습니다.');
console.log('현재 히스토리:', urlHistoryData);



// 제목 수정 모달 표시
function showEditTitleModal(userUrlId, currentTitle) {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('editTitleModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'editTitleModal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>제목 수정</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="newTitle">새 제목</label>
                        <input type="text" id="newTitle" value="${currentTitle}" maxlength="50" placeholder="제목을 입력하세요 (최대 50자)">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary">취소</button>
                    <button class="btn-primary">수정</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 표시 애니메이션
    setTimeout(() => {
        modal.querySelector('.modal-overlay').style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
    
    // 입력 필드 포커스
    document.getElementById('newTitle').focus();
}

// 제목 수정 모달 닫기
function closeEditTitleModal() {
    const modal = document.getElementById('editTitleModal');
    if (modal) {
        modal.querySelector('.modal-overlay').style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

// 제목 업데이트 API 호출
async function updateTitle(userUrlId) {
    const newTitle = document.getElementById('newTitle').value.trim();
    
    if (!newTitle) {
        showNotification('제목을 입력해주세요.', 'error');
        return;
    }
    
    if (newTitle.length > 50) {
        showNotification('제목은 최대 50자까지 입력 가능합니다.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8080/user-urls/${userUrlId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newTitle: newTitle
            })
        });
        
        const data = await response.json();
        
        if (response.status === 200) {
            // 성공적으로 제목 업데이트됨
            const updatedData = data.data || data;
            
            // 로컬 데이터 업데이트
            const urlIndex = urlHistoryData.findIndex(url => url.id === userUrlId);
            if (urlIndex !== -1) {
                urlHistoryData[urlIndex].title = updatedData.title || newTitle;
                localStorage.setItem('urlHistory', JSON.stringify(urlHistoryData));
                
                // UI 업데이트
                displayUrlHistory();
            }
            
            showNotification('제목이 성공적으로 수정되었습니다!', 'success');
            closeEditTitleModal();
            
        } else {
            // 서버 에러 처리
            let errorMessage = '제목 수정에 실패했습니다.';
            
            if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            }
            
            showNotification(errorMessage, 'error');
            console.error('서버 응답:', data);
        }
        
    } catch (error) {
        console.error('제목 수정 오류:', error);
        showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// 비밀번호 유효성 검사
function isValidPassword(password) {
    // 길이 검사 (8-15자)
    if (password.length < 8 || password.length > 15) {
        return false;
    }
    
    // 영문자 포함 여부 검사
    if (!/[A-Za-z]/.test(password)) {
        return false;
    }
    
    // 숫자 포함 여부 검사
    if (!/\d/.test(password)) {
        return false;
    }
    
    // 영문자와 숫자만 허용
    if (!/^[A-Za-z\d]+$/.test(password)) {
        return false;
    }
    
    return true;
}

// 비밀번호 변경 모달 표시
function showChangePasswordModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('changePasswordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>비밀번호 변경</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="newPassword">새 비밀번호</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="newPassword" placeholder="영문자와 숫자 포함 8-15자" maxlength="15">
                            <button type="button" class="toggle-password-btn">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <small class="form-help">영문자와 숫자를 포함하여 8-15자로 입력해주세요.</small>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">새 비밀번호 확인</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="confirmPassword" placeholder="새 비밀번호를 다시 입력하세요" maxlength="15">
                            <button type="button" class="toggle-password-btn">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary">취소</button>
                    <button class="btn-primary">변경</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // 모달 버튼에 이벤트 리스너 추가
    modal.querySelector('.modal-close').addEventListener('click', closeChangePasswordModal);
    modal.querySelector('.btn-secondary').addEventListener('click', closeChangePasswordModal);
    modal.querySelector('.btn-primary').addEventListener('click', changePassword);
    
    // 비밀번호 보기/숨기기 버튼
    modal.querySelectorAll('.toggle-password-btn').forEach((btn, index) => {
        const inputId = index === 0 ? 'newPassword' : 'confirmPassword';
        btn.addEventListener('click', () => togglePasswordVisibility(inputId));
    });
    
    // 모달 표시 애니메이션
    setTimeout(() => {
        modal.querySelector('.modal-overlay').style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
    
    // 입력 필드 포커스
    document.getElementById('newPassword').focus();
}

// 비밀번호 변경 모달 닫기
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.querySelector('.modal-overlay').style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

// 비밀번호 표시/숨김 토글
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggleBtn = input.parentNode.querySelector('.toggle-password-btn i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

// 비밀번호 변경 API 호출
async function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 유효성 검사
    if (!newPassword) {
        showNotification('새 비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (!isValidPassword(newPassword)) {
        showNotification('비밀번호는 영문자와 숫자를 포함하여 8-15자로 입력해주세요.', 'error');
        return;
    }
    
    try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            showNotification('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.', 'error');
            return;
        }
        
        const response = await fetch(`http://localhost:8080/user/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rawNewPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 성공적으로 비밀번호 변경됨
            showNotification('비밀번호가 성공적으로 변경되었습니다!', 'success');
            closeChangePasswordModal();
            
        } else {
            const errorMessage = data.message || '비밀번호 변경에 실패했습니다.';
            showNotification(errorMessage, 'error');
            console.error('서버 응답:', data);
        }
        
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
} 