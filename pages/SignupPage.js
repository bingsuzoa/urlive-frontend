// ULIVE-FRONTEND/js/pages/SignupPage.js
import { showNotification } from '../app.js'; 
import { navigateTo } from '../router.js'; 
import { fetchCountries, signupUser } from '../api.js'; // 필요한 api 함수 임포트

class SignupPage {
    constructor() {
        this.signupForm = null;
        this.nameInput = null;
        this.phoneNumberInput = null;
        this.passwordInput = null;
        this.ageInput = null;
        this.genderInputs = null;
        this.isoCodeSelect = null;
        this.agreeTermsCheckbox = null;
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
                        <p class="login-tagline">회원가입</p>
                    </div>

                    <form id="signupForm" class="login-form">
                        <div class="form-group">
                            <label for="name">이름 *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-user"></i>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    placeholder="이름을 입력하세요 (최대 10자)" 
                                    required
                                    maxlength="10"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="phoneNumber">휴대폰 번호 *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-mobile-alt"></i>
                                <input 
                                    type="text" 
                                    id="phoneNumber" 
                                    name="phoneNumber" 
                                    placeholder="01012345678" 
                                    required
                                    pattern="^01[0-9]{8,9}$"
                                    maxlength="11"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="password">비밀번호 *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-lock"></i>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    placeholder="영문자와 숫자 포함 8-15자" 
                                    required
                                    minlength="8"
                                    maxlength="15"
                                >
                                <button type="button" class="toggle-password"> <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <small class="form-help">영문자와 숫자를 포함하여 8-15자로 입력해주세요.</small>
                        </div>

                        <div class="form-group">
                            <label for="age">생년월일 *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-calendar"></i>
                                <input 
                                    type="number" 
                                    id="age" 
                                    name="age" 
                                    placeholder="생년월일 (예: 19900101)" 
                                    required
                                    min="19000101"
                                >
                            </div>
                            <small class="form-help">YYYYMMDD 형식으로 입력해주세요. (예: 19900101)</small>
                        </div>

                        <div class="form-group">
                            <label>성별 *</label>
                            <div class="radio-group">
                                <label class="radio-wrapper">
                                    <input type="radio" name="gender" value="0" required>
                                    <span class="radio-mark"></span>
                                    남성
                                </label>
                                <label class="radio-wrapper">
                                    <input type="radio" name="gender" value="1" required>
                                    <span class="radio-mark"></span>
                                    여성
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="isoCode">국가 *</label>
                            <div class="input-wrapper">
                                <i class="fas fa-globe"></i>
                                <select id="isoCode" name="isoCode" required>
                                    <option value="">국가를 선택하세요</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-options">
                            <label class="checkbox-wrapper">
                                <input type="checkbox" id="agreeTerms" required>
                                <span class="checkmark"></span>
                                <a href="#" class="terms-link" data-link>이용약관</a> 및 <a href="#" class="terms-link" data-link>개인정보처리방침</a>에 동의합니다 </label>
                        </div>

                        <button type="submit" class="login-btn">
                            <i class="fas fa-user-plus"></i>
                            회원가입
                        </button>
                    </form>

                    <div class="signup-link">
                        <p>이미 계정이 있으신가요? <a href="/login" data-link>로그인</a></p> </div>
                </div>
            </div>

            <div id="notification" class="notification hidden">
                <span id="notificationMessage"></span>
            </div>
            `;
    }

    async executeScript() {
        this.signupForm = document.getElementById('signupForm'); 
        this.nameInput = document.getElementById('name');
        this.phoneNumberInput = document.getElementById('phoneNumber');
        this.passwordInput = document.getElementById('password');
        this.ageInput = document.getElementById('age');
        this.genderInputs = document.querySelectorAll('input[name="gender"]'); 
        this.isoCodeSelect = document.getElementById('isoCode'); 
        this.agreeTermsCheckbox = document.getElementById('agreeTerms'); 
        
        await this.loadCountries(); 
        
        const togglePasswordBtn = document.querySelector('.toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', this.togglePassword.bind(this));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        this.phoneNumberInput.addEventListener('input', this.handlePhoneNumberInput.bind(this));
        this.ageInput.addEventListener('input', this.handleAgeInput.bind(this));

        document.querySelectorAll('.terms-link').forEach(link => {
            link.addEventListener('click', this.handleTermsLinkClick.bind(this));
        });

        console.log('URLive 회원가입 페이지가 로드되었습니다.');
        console.log('회원가입 API: http://15.164.73.228:8080/user'); 
    }

    async loadCountries() {
        try {
            // api.js에서 임포트한 fetchCountries 함수 사용
            const countries = await fetchCountries();
            this.populateCountryDropdown(countries);
        } catch (error) {
            console.error('국가 데이터 로드 오류:', error);
            showNotification(error.message, 'error');
        }
    }

    populateCountryDropdown(countries) { 
        while (this.isoCodeSelect.children.length > 1) {
            this.isoCodeSelect.removeChild(this.isoCodeSelect.lastChild);
        }
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.isoCode;
            option.textContent = country.name;
            this.isoCodeSelect.appendChild(option);
        });
        
        console.log(`${countries.length}개의 국가가 로드되었습니다.`);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const name = this.nameInput.value.trim();
        const phoneNumber = this.phoneNumberInput.value.trim();
        const password = this.passwordInput.value;
        const age = parseInt(this.ageInput.value);
        const gender = Array.from(this.genderInputs).find(radio => radio.checked)?.value;
        const isoCode = this.isoCodeSelect.value;
        const agreeTerms = this.agreeTermsCheckbox.checked;
        
        if (!this.validateForm(name, phoneNumber, password, age, gender, isoCode, agreeTerms)) { 
            return;
        }
        
        await this.handleSignup({ name, phoneNumber, password, age, gender: parseInt(gender), isoCode });
    }

    validateForm(name, phoneNumber, password, age, gender, isoCode, agreeTerms) { 
        if (!name || name.length > 10) {
            showNotification('이름은 필수이며 최대 10자까지 입력 가능합니다.', 'error');
            return false;
        }
        
        if (!this.isValidPhoneNumber(phoneNumber)) { 
            showNotification('올바른 휴대폰 번호 형식을 입력해주세요. (예: 01012345678)', 'error');
            return false;
        }
        
        if (!this.isValidPassword(password)) { 
            showNotification('비밀번호는 영문자와 숫자를 포함하여 8-15자로 입력해주세요.', 'error');
            return false;
        }
        
        if (!this.isValidAge(age)) { 
            showNotification('올바른 생년월일을 입력해주세요. (YYYYMMDD 형식)', 'error');
            return false;
        }
        
        if (gender === null || gender === undefined || gender === '') {
            showNotification('성별을 선택해주세요.', 'error');
            return false;
        }
        
        if (!isoCode) {
            showNotification('국가를 선택해주세요.', 'error');
            return false;
        }
        
        if (!agreeTerms) {
            showNotification('이용약관에 동의해주세요.', 'error');
            return false;
        }
        
        return true;
    }

    isValidPhoneNumber(phoneNumber) { 
        return /^01[0-9]{8,9}$/.test(phoneNumber);
    }

    isValidPassword(password) { 
        if (password.length < 8 || password.length > 15) {
            return false;
        }
        if (!/[A-Za-z]/.test(password)) {
            return false;
        }
        if (!/\d/.test(password)) {
            return false;
        }
        if (!/^[A-Za-z\d]+$/.test(password)) {
            return false;
        }
        return true;
    }

    isValidAge(age) { 
        if (!age || isNaN(age)) return false;
        
        const ageStr = age.toString();
        if (ageStr.length !== 8) return false;
        
        const year = parseInt(ageStr.substring(0, 4));
        const month = parseInt(ageStr.substring(4, 6));
        const day = parseInt(ageStr.substring(6, 8));
        
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 1) return false;
        
        const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        if (month === 2) {
            const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            if (isLeapYear) {
                daysInMonth[2] = 29;
            }
        }
        
        if (month < 1 || month > 12) return false; // 월 유효성 검사 추가
        if (day < 1 || day > daysInMonth[month]) return false;
        
        return true;
    }

    async handleSignup(userData) { 
        try {
            // api.js에서 임포트한 signupUser 함수 사용
            const data = await signupUser(userData);
            
            showNotification('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            
            setTimeout(() => {
                navigateTo('/login'); 
            }, 2000);
            
        } catch (error) {
            console.error('회원가입 오류:', error);
            showNotification(error.message, 'error');
        }
    }

    togglePassword() { 
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            document.querySelector('.toggle-password i').className = 'fas fa-eye-slash';
        } else {
            this.passwordInput.type = 'password';
            document.querySelector('.toggle-password i').className = 'fas fa-eye';
        }
    }

    handlePhoneNumberInput(e) {
        const value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value;
    }

    handleAgeInput(e) {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 8) {
            e.target.value = value.substring(0, 8);
        }
    }

    handleTermsLinkClick(e) { 
        e.preventDefault();
        showNotification('이용약관 페이지는 현재 개발 중입니다.', 'warning');
    }
}

export default SignupPage;
// ULIVE-FRONTEND/js/pages/SignupPage.js