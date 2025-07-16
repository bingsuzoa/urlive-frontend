// ULIVE-FRONTEND/js/pages/LoginPage.js
import { showNotification } from '../app.js'; 
import { navigateTo, router } from '../router.js'; 
import { loginUser } from '../api.js'; // loginUser 함수만 필요하므로 필요한 것만 임포트

class LoginPage {
    constructor() {
        this.loginForm = null;
        this.phoneNumberInput = null;
        this.passwordInput = null;
        // notification 관련 요소는 showNotification 함수가 app.js에서 관리하므로
        // 이 클래스 내에서는 직접 DOM을 참조할 필요가 없습니다.
    }

    async getHtml() {
        return `
            <div class="container">
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-header">
                            <div class="logo">
                                <i class="fas fa-link"></i>
                                <h1>URLive</h1>
                            </div>
                            <p class="login-tagline">URL 단축 서비스에 오신 것을 환영합니다</p>
                        </div>

                        <form id="loginForm" class="login-form">
                            <div class="form-group">
                                <label for="phoneNumber">휴대폰 번호</label>
                                <div class="input-wrapper">
                                    <i class="fas fa-mobile-alt"></i>
                                    <input 
                                        type="text" 
                                        id="phoneNumber" 
                                        name="phoneNumber" 
                                        placeholder="01022223333" 
                                        required
                                        pattern="^01[0-9]{8,9}$"
                                        maxlength="11"
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="password">비밀번호</label>
                                <div class="input-wrapper">
                                    <i class="fas fa-lock"></i>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        name="password" 
                                        placeholder="비밀번호를 입력하세요" 
                                        required
                                    >
                                    <button type="button" class="toggle-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" class="login-btn">
                                <i class="fas fa-sign-in-alt"></i>
                                로그인
                            </button>
                        </form>

                        <div class="signup-link">
                            <p>계정이 없으신가요? <a href="/signup" data-link>회원가입</a></p>
                        </div>
                    </div>
                </div>

                <div id="notification" class="notification hidden">
                    <span id="notificationMessage"></span>
                </div>
            </div>
        `;
    }

    executeScript() {
        this.loginForm = document.getElementById('loginForm');
        this.phoneNumberInput = document.getElementById('phoneNumber');
        this.passwordInput = document.getElementById('password');
        
        // 중요: HTML에 있던 onclick="togglePassword()"는 이제 작동하지 않으므로,
        // 이곳에서 이벤트 리스너를 다시 연결해야 합니다.
        // this.passwordInput이 아니라 passwordInput 요소의 부모에서 .toggle-password를 찾아야 합니다.
        const togglePasswordBtn = document.querySelector('.toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', this.togglePassword.bind(this));
        }

        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // 초기 로그인 상태 확인 (dashboard로 바로 이동할 경우)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const token = localStorage.getItem('authToken');
        
        if (isLoggedIn && token) {
            // 이미 로그인된 경우 대시보드로 리다이렉트
            history.replaceState(null, null, '/dashboard'); // History에 남기지 않음
            router(); // 라우터 재실행
            return;
        }

        console.log('URLive 로그인 페이지가 로드되었습니다.');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const phoneNumber = this.phoneNumberInput.value.trim();
        const password = this.passwordInput.value;
        
        if (!phoneNumber || !password) {
            showNotification('휴대폰 번호와 비밀번호를 모두 입력해주세요.', 'error');
            return;
        }
        
        if (!this.isValidPhoneNumber(phoneNumber)) {
            showNotification('올바른 휴대폰 번호 형식을 입력해주세요.', 'error');
            return;
        }
        
        await this.handleLogin(phoneNumber, password);
    }

    async handleLogin(phoneNumber, password) {
        try {
            // api.js에서 임포트한 loginUser 함수 사용
            const data = await loginUser(phoneNumber, password);
            
            // 로그인 성공 로직
            localStorage.setItem('authToken', data.token || 'logged-in');
            localStorage.setItem('userPhone', phoneNumber);
            localStorage.setItem('isLoggedIn', 'true');
            if (data.data) {
                localStorage.setItem('userData', JSON.stringify(data.data));
                localStorage.setItem('userId', data.data.id);
                localStorage.setItem('userName', data.data.name);
                localStorage.setItem('userAge', data.data.age);
                localStorage.setItem('userGender', data.data.gender);
                localStorage.setItem('userIsoCode', data.data.countryDto?.isoCode);
            }
            showNotification(data.message || '로그인되었습니다!', 'success');
            setTimeout(() => {
                navigateTo('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('로그인 오류:', error);
            showNotification(error.message, 'error'); // API 함수에서 에러 메시지를 던지므로 바로 사용
        }
    }

    isValidPhoneNumber(phoneNumber) {
        return /^01[0-9]{8,9}$/.test(phoneNumber);
    }

    togglePassword() {
        // this.passwordInput을 직접 사용
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            document.querySelector('.toggle-password i').className = 'fas fa-eye-slash';
        } else {
            this.passwordInput.type = 'password';
            document.querySelector('.toggle-password i').className = 'fas fa-eye';
        }
    }
}

export default LoginPage;