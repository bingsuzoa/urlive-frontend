// ULIVE-FRONTEND/js/pages/DashboardPage.js
import { navigateTo } from '../router.js'; 
import { showNotification } from '../app.js'; 
import { fetchUserUrls, createShortUrl, updateUrlTitle, deleteUserUrl, updatePassword } from '../api.js'; // 필요한 api 함수 임포트

class DashboardPage {
    constructor() {
        this.userNameElement = null;
        this.urlForm = null;
        this.originalUrlInput = null;
        this.resultContainer = null;
        this.shortUrlInput = null;
        this.copyBtn = null;
        this.originalUrlDisplay = null;
        this.createdDateDisplay = null;
        this.urlHistoryElement = null;
        this.loadingSpinner = null;
        this.urlTitleElement = null; 
        this.viewCountElement = null;
        this.logoutBtn = null;
        this.changePasswordBtn = null;

        this.urlHistoryData = []; // 클래스 인스턴스 변수로 관리
    }

    async getHtml() {
        return `
            <div class="container">
                <header class="header">
                    <div class="header-top">
                        <div class="logo">
                            <i class="fas fa-link"></i>
                            <h1>URLive</h1>
                        </div>
                        <div class="user-info">
                            <span class="user-name" id="userName">사용자</span>
                            <button id="changePasswordBtn" class="change-password-btn" title="비밀번호 변경">
                                <i class="fas fa-key"></i>
                                비밀번호 변경
                            </button>
                            <button id="logoutBtn" class="logout-btn" title="로그아웃">
                                <i class="fas fa-sign-out-alt"></i>
                                로그아웃
                            </button>
                        </div>
                    </div>
                    <p class="tagline">긴 URL을 짧고 기억하기 쉬운 링크로 변환하세요</p>
                </header>

                <main class="main">
                    <div class="url-form-container">
                        <form id="urlForm" class="url-form">
                            <div class="input-group">
                                <input 
                                    type="url" 
                                    id="originalUrl" 
                                    placeholder="https://example.com/very-long-url-that-needs-to-be-shortened" 
                                    required
                                >
                                <button type="submit" class="submit-btn">
                                    <i class="fas fa-magic"></i>
                                    단축하기
                                </button>
                            </div>
                        </form>
                    </div>

                    <div id="resultContainer" class="result-container hidden">
                        <div class="result-card">
                            <h3>단축된 URL</h3>
                            <div class="short-url-display">
                                <input type="text" id="shortUrl" readonly>
                                <button id="copyBtn" class="copy-btn">
                                    <i class="fas fa-copy"></i>
                                    복사
                                </button>
                            </div>
                            <div class="url-info">
                                <div class="info-item">
                                    <span class="label">제목:</span>
                                    <span id="urlTitle" class="value"></span>
                                </div>
                                <div class="info-item">
                                    <span class="label">원본 URL:</span>
                                    <span id="originalUrlDisplay" class="value"></span>
                                </div>
                                <div class="info-item">
                                    <span class="label">생성일:</span>
                                    <span id="createdDate" class="value"></span>
                                </div>
                                <div class="info-item">
                                    <span class="label">조회수:</span>
                                    <span id="viewCount" class="value">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="historyContainer" class="history-container">
                        <h3>최근 단축된 URL</h3>
                        <div id="urlHistory" class="url-history">
                            </div>
                    </div>
                </main>

                <div id="loadingSpinner" class="loading-spinner hidden">
                    <div class="spinner"></div>
                    <p>URL을 단축하는 중...</p>
                </div>

                <div id="notification" class="notification hidden">
                    <span id="notificationMessage"></span>
                </div>
            </div>
        `;
    }

    async executeScript() {
        this.initDOMElements();

        this.checkAuthStatus();
        
        await this.loadAndDisplayUserUrls();

        if (this.logoutBtn) this.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        if (this.changePasswordBtn) this.changePasswordBtn.addEventListener('click', this.showChangePasswordModal.bind(this));
        if (this.urlForm) this.urlForm.addEventListener('submit', this.handleSubmitUrlForm.bind(this));
        if (this.copyBtn) this.copyBtn.addEventListener('click', () => this.copyToClipboard(this.shortUrlInput.value));
        if (this.urlHistoryElement) this.urlHistoryElement.addEventListener('click', this.handleHistoryActions.bind(this));
        if (this.originalUrlInput) this.originalUrlInput.addEventListener('focus', () => this.originalUrlInput.select());
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('beforeunload', () => {
            if (this.originalUrlInput) this.originalUrlInput.value = '';
        });
    }

    initDOMElements() {
        this.userNameElement = document.getElementById('userName');
        this.urlForm = document.getElementById('urlForm');
        this.originalUrlInput = document.getElementById('originalUrl');
        this.resultContainer = document.getElementById('resultContainer');
        this.shortUrlInput = document.getElementById('shortUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.originalUrlDisplay = document.getElementById('originalUrlDisplay');
        this.createdDateDisplay = document.getElementById('createdDate');
        this.urlHistoryElement = document.getElementById('urlHistory');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        // this.notification, this.notificationMessage는 showNotification이 app.js에 있으므로 직접 참조할 필요 없음
        this.urlTitleElement = document.getElementById('urlTitle'); 
        this.viewCountElement = document.getElementById('viewCount');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.changePasswordBtn = document.getElementById('changePasswordBtn');
        
        this.displayUserInfo();
    }

    checkAuthStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const token = localStorage.getItem('authToken');
        
        if (!isLoggedIn || !token) {
            console.log('로그인되지 않음 - 로그인 페이지로 이동');
            navigateTo('/login'); 
            return;
        }
    }

    displayUserInfo() {
        const userName = localStorage.getItem('userName');
        const userData = localStorage.getItem('userData');
        
        if (userName && this.userNameElement) {
            this.userNameElement.textContent = userName;
        } else if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name && this.userNameElement) {
                    this.userNameElement.textContent = user.name;
                }
            } catch (error) {
                console.error('사용자 정보 파싱 오류:', error);
            }
        }
    }

    async loadAndDisplayUserUrls() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.warn("userId가 로컬 스토리지에 없습니다. URL 로드를 건너뜝니다.");
                this.urlHistoryData = []; 
                this.displayUrlHistory(); 
                return;
            }
            // api.js에서 임포트한 fetchUserUrls 함수 사용
            const rawUrls = await fetchUserUrls(userId);
    
            const serverUrls = rawUrls.map(item => ({
                id: item.id,
                originalUrl: item.originalUrl,
                shortUrl: `http://15.164.73.228:8080/${item.shortUrl}`,
                title: item.title || '제목 없음',
                createdAt: item.createdAt,
                viewCount: item.viewCount || 0
            }));
            
            this.urlHistoryData = serverUrls;
            localStorage.setItem('urlHistory', JSON.stringify(this.urlHistoryData));
            
            this.displayUrlHistory();
            
            console.log(`${serverUrls.length}개의 URL을 서버에서 로드했습니다.`);
        } catch (error) {
            console.error('URL 목록 로드 오류:', error);
            showNotification('URL 목록 로드에 실패했습니다.', 'error');
        }
    }

    async handleSubmitUrlForm(e) {
        e.preventDefault();
        const originalUrl = this.originalUrlInput.value.trim();
        if (!this.isValidUrl(originalUrl)) {
            showNotification('올바른 URL을 입력해주세요.', 'error');
            return;
        }
        await this.shortenUrl(originalUrl);
    }

    isValidUrl(string) {
        const urlPattern = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
        return urlPattern.test(string);
    }

    displayResult(originalUrl, shortUrl, title, createdAt, viewCount) {
        this.shortUrlInput.value = shortUrl;
        this.urlTitleElement.textContent = title || '제목 없음';
        this.originalUrlDisplay.textContent = originalUrl;
        this.createdDateDisplay.textContent = new Date(createdAt).toLocaleString('ko-KR');
        this.viewCountElement.textContent = viewCount || 0;
        
        this.resultContainer.classList.remove('hidden');
        this.resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    addToHistory(entry) {
        this.urlHistoryData = this.urlHistoryData.filter(e => e.originalUrl !== entry.originalUrl);
        this.urlHistoryData.unshift(entry);
        if (this.urlHistoryData.length > 10) {
            this.urlHistoryData = this.urlHistoryData.slice(0, 10);
        }
        localStorage.setItem('urlHistory', JSON.stringify(this.urlHistoryData));
        this.displayUrlHistory();
    }

    displayUrlHistory() {
        if (!this.urlHistoryElement) return;
        if (this.urlHistoryData.length === 0) {
            this.urlHistoryElement.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">아직 단축된 URL이 없습니다.</p>';
            return;
        }
        this.urlHistoryElement.innerHTML = this.urlHistoryData.map(entry => {
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
                            <div class="original-url">${this.truncateUrl(entry.originalUrl, 50)}</div>
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
            `;
        }).join('');
    }

    handleHistoryActions(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const historyItem = button.closest('.history-item');
        const userUrlId = Number(historyItem.dataset.id);
        const fullShortUrl = historyItem.querySelector('.short-url').dataset.shortUrl;
        
        const entry = this.urlHistoryData.find(item => item.id === userUrlId);
        if (!entry) return;

        switch (action) {
            case 'copy':
                this.copyToClipboard(entry.shortUrl);
                break;
            case 'open':
                this.openUrl(entry.shortUrl);
                break;
            case 'delete':
                this.showDeleteConfirmationModal(userUrlId, entry.originalUrl);
                break;
            case 'edit-title':
                this.showEditTitleModal(userUrlId, entry.title);
                break;
            case 'insights':
                const shortUrlCode = fullShortUrl.split('/').pop();
                navigateTo(`/insight?shortUrlCode=${shortUrlCode}`); 
                break;
            default:
                console.warn('알 수 없는 액션:', action);
        }
    }

    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('클립보드에 복사되었습니다!', 'success');
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('클립보드에 복사되었습니다!', 'success');
        }
    }

    openUrl(shortUrl) {
        window.open(shortUrl, '_blank');
    }

    async deleteFromHistory(userUrlId) {
        try {
            // api.js에서 임포트한 deleteUserUrl 함수 사용
            await deleteUserUrl(userUrlId);
            
            this.urlHistoryData = this.urlHistoryData.filter(entry => entry.id !== userUrlId);
            localStorage.setItem('urlHistory', JSON.stringify(this.urlHistoryData));
            this.displayUrlHistory();
            showNotification('항목이 삭제되었습니다.', 'success');
        } catch (error) {
            console.error('URL 삭제 오류:', error);
            showNotification(error.message, 'error');
        }
    }

    showLoading(show) {
        if (this.loadingSpinner) {
            if (show) {
                this.loadingSpinner.classList.remove('hidden');
            } else {
                this.loadingSpinner.classList.add('hidden');
            }
        }
    }

    handleKeyDown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (this.urlForm) this.urlForm.dispatchEvent(new Event('submit'));
        }
        if (e.key === 'Escape') {
            if (this.resultContainer) this.resultContainer.classList.add('hidden');
        }
    }

    async shortenUrl(originalUrl) {
        this.showLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            // api.js에서 임포트한 createShortUrl 함수 사용
            const newUrlData = await createShortUrl(userId, originalUrl);

            const newEntry = {
                id: newUrlData.id,
                originalUrl: newUrlData.originalUrl,
                shortUrl: `http://15.164.73.228:8080/${newUrlData.shortUrl}`,
                title: newUrlData.title || '제목 없음',
                createdAt: newUrlData.createdAt,
                viewCount: newUrlData.viewCount || 0
            };

            this.displayResult(newEntry.originalUrl, newEntry.shortUrl, newEntry.title, newEntry.createdAt, newEntry.viewCount);
            this.addToHistory(newEntry);
            if (this.originalUrlInput) this.originalUrlInput.value = '';
            showNotification('URL이 성공적으로 단축되었습니다!', 'success');

        } catch (error) {
            console.error('URL 단축 오류:', error);
            showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    getStats() { // 현재 DashboardPage에서는 사용되지 않지만, 다른 곳에서 사용 가능
        const totalUrls = this.urlHistoryData.length;
        const today = new Date().toDateString();
        const todayUrls = this.urlHistoryData.filter(entry => 
            new Date(entry.createdAt).toDateString() === today
        ).length;
        return { total: totalUrls, today: todayUrls };
    }

    showDeleteConfirmationModal(userUrlId, originalUrl) {
        // 기존 모달이 있으면 제거 (중복 방지)
        const existingModal = document.getElementById('deleteConfirmationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 모달 DOM 요소 생성
        const modal = document.createElement('div');
        modal.id = 'deleteConfirmationModal'; // 고유한 ID 부여
        modal.className = 'modal-overlay'; // styles.css의 modal-overlay 클래스 재사용

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>URL 삭제 확인</h3>
                    <button class="modal-close" data-action="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="text-align: center; margin-bottom: 20px;">
                        정말로 이 URL을 삭제하시겠습니까?<br>
                        <strong style="color: #ef4444;">${this.truncateUrl(originalUrl, 60)}</strong>
                        <br>
                        삭제된 URL은 복구할 수 없습니다.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" data-action="cancel-delete">취소</button>
                    <button class="btn-primary btn-delete" data-action="confirm-delete">삭제</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 모달 표시 애니메이션 (기존 모달들과 동일)
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);

        // 이벤트 리스너 추가: 취소, 삭제 버튼 및 모달 닫기 버튼
        modal.addEventListener('click', (e) => {
            const action = e.target.closest('button')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'close-modal':
                case 'cancel-delete':
                    this.closeDeleteConfirmationModal();
                    break;
                case 'confirm-delete':
                    this.closeDeleteConfirmationModal();
                    this.deleteFromHistory(userUrlId); // 삭제 로직 호출
                    break;
            }
        });
    }

    closeDeleteConfirmationModal() {
        const modal = document.getElementById('deleteConfirmationModal');
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
            setTimeout(() => {
                modal.remove();
            }, 200); // CSS transition 시간과 맞춰주는 것이 좋습니다.
        }
    }
    
    showEditTitleModal(userUrlId, currentTitle) {
        const existingModal = document.getElementById('editTitleModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'editTitleModal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h3>제목 수정</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>
                    <div class="modal-body"><div class="form-group"><label for="newTitle">새 제목</label><input type="text" id="newTitle" value="${currentTitle}" maxlength="50" placeholder="제목을 입력하세요 (최대 50자)"></div></div>
                    <div class="modal-footer"><button class="btn-secondary">취소</button><button class="btn-primary">수정</button></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.querySelector('.modal-overlay').style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        
        modal.querySelector('.modal-close').addEventListener('click', this.closeEditTitleModal.bind(this));
        modal.querySelector('.btn-secondary').addEventListener('click', this.closeEditTitleModal.bind(this));
        modal.querySelector('.btn-primary').addEventListener('click', () => this.updateTitle(userUrlId));
        document.getElementById('newTitle').focus();
    }

    closeEditTitleModal() {
        const modal = document.getElementById('editTitleModal');
        if (modal) {
            modal.querySelector('.modal-overlay').style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
            setTimeout(() => { modal.remove(); }, 200);
        }
    }

    async updateTitle(userUrlId) {
        const newTitle = document.getElementById('newTitle').value.trim();
        if (!newTitle) { showNotification('제목을 입력해주세요.', 'error'); return; }
        if (newTitle.length > 50) { showNotification('제목은 최대 50자까지 입력 가능합니다.', 'error'); return; }
        
        try {
            // api.js에서 임포트한 updateUrlTitle 함수 사용
            const data = await updateUrlTitle(userUrlId, newTitle);
            
            // 성공적으로 제목 업데이트됨
            const updatedData = data.data || data; // API 응답 형태에 따라 data.data 또는 data 사용
            const urlIndex = this.urlHistoryData.findIndex(url => url.id === userUrlId);
            if (urlIndex !== -1) {
                this.urlHistoryData[urlIndex].title = updatedData.title || newTitle;
                localStorage.setItem('urlHistory', JSON.stringify(this.urlHistoryData));
                this.displayUrlHistory();
            }
            showNotification('제목이 성공적으로 수정되었습니다!', 'success');
            this.closeEditTitleModal();
        } catch (error) {
            console.error('제목 수정 오류:', error);
            showNotification(error.message, 'error');
        }
    }

    isValidPassword(password) {
        return password.length >= 8 && password.length <= 15 && /[A-Za-z]/.test(password) && /\d/.test(password) && /^[A-Za-z\d]+$/.test(password);
    }

    showChangePasswordModal() {
        const existingModal = document.getElementById('changePasswordModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'changePasswordModal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h3>비밀번호 변경</h3><button class="modal-close"><i class="fas fa-times"></i></button></div>
                    <div class="modal-body">
                        <div class="form-group"><label for="newPassword">새 비밀번호</label><div class="password-input-wrapper"><input type="password" id="newPassword" placeholder="영문자와 숫자 포함 8-15자" maxlength="15"><button type="button" class="toggle-password-btn"><i class="fas fa-eye"></i></button></div><small class="form-help">영문자와 숫자를 포함하여 8-15자로 입력해주세요.</small></div>
                        <div class="form-group"><label for="confirmPassword">새 비밀번호 확인</label><div class="password-input-wrapper"><input type="password" id="confirmPassword" placeholder="새 비밀번호를 다시 입력하세요" maxlength="15"><button type="button" class="toggle-password-btn"><i class="fas fa-eye"></i></button></div></div>
                    </div>
                    <div class="modal-footer"><button class="btn-secondary">취소</button><button class="btn-primary">변경</button></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', this.closeChangePasswordModal.bind(this));
        modal.querySelector('.btn-secondary').addEventListener('click', this.closeChangePasswordModal.bind(this));
        modal.querySelector('.btn-primary').addEventListener('click', this.changePassword.bind(this));
        
        modal.querySelectorAll('.toggle-password-btn').forEach((btn, index) => {
            const inputId = index === 0 ? 'newPassword' : 'confirmPassword';
            btn.addEventListener('click', () => this.togglePasswordVisibility(inputId));
        });
        
        setTimeout(() => {
            modal.querySelector('.modal-overlay').style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        document.getElementById('newPassword').focus();
    }

    closeChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.querySelector('.modal-overlay').style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
            setTimeout(() => { modal.remove(); }, 200);
        }
    }

    togglePasswordVisibility(inputId) {
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

    async changePassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!newPassword) { showNotification('새 비밀번호를 입력해주세요.', 'error'); return; }
        if (newPassword !== confirmPassword) { showNotification('비밀번호가 일치하지 않습니다.', 'error'); return; }
        if (!this.isValidPassword(newPassword)) { showNotification('비밀번호는 영문자와 숫자를 포함하여 8-15자로 입력해주세요.', 'error'); return; }
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) { showNotification('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.', 'error'); return; }
            
            // api.js에서 임포트한 updatePassword 함수 사용
            await updatePassword(userId, newPassword);
            
            showNotification('비밀번호가 성공적으로 변경되었습니다!', 'success');
            this.closeChangePasswordModal();
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            showNotification(error.message, 'error');
        }
    }

    handleLogout() {
        localStorage.clear();
        navigateTo('/login'); 
    }
}

export default DashboardPage;