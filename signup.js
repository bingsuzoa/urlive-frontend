// DOM 요소들
const signupForm = document.getElementById('signupForm');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    await loadCountries();
});

// 국가 데이터 로드
async function loadCountries() {
    try {
        const response = await fetch('http://localhost:8080/countries', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (response.status === 200 && data.data) {
            populateCountryDropdown(data.data);
        } else {
            console.error('국가 데이터 로드 실패:', data.message);
            showNotification('국가 목록을 불러오는데 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('국가 데이터 로드 오류:', error);
        showNotification('서버 연결에 실패했습니다.', 'error');
    }
}

// 국가 드롭다운 구성
function populateCountryDropdown(countries) {
    const countrySelect = document.getElementById('isoCode');
    
    // 기존 옵션 제거 (기본 "국가를 선택하세요" 제외)
    while (countrySelect.children.length > 1) {
        countrySelect.removeChild(countrySelect.lastChild);
    }
    
    // 국가 데이터로 옵션 추가
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.isoCode;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
    
    console.log(`${countries.length}개의 국가가 로드되었습니다.`);
}

// 회원가입 폼 제출 이벤트
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(signupForm);
    const name = formData.get('name').trim();
    const phoneNumber = formData.get('phoneNumber').trim();
    const password = formData.get('password');
    const age = parseInt(formData.get('age'));
    const gender = formData.get('gender');
    const isoCode = formData.get('isoCode');
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // 유효성 검사
    if (!validateForm(name, phoneNumber, password, age, gender, isoCode, agreeTerms)) {
        return;
    }
    
    await handleSignup(name, phoneNumber, password, age, parseInt(gender), isoCode);
});

// 폼 유효성 검사
function validateForm(name, phoneNumber, password, age, gender, isoCode, agreeTerms) {
    // 이름 검사
    if (!name || name.length > 10) {
        showNotification('이름은 필수이며 최대 10자까지 입력 가능합니다.', 'error');
        return false;
    }
    
    // 휴대폰 번호 검사
    if (!isValidPhoneNumber(phoneNumber)) {
        showNotification('올바른 휴대폰 번호 형식을 입력해주세요. (예: 01012345678)', 'error');
        return false;
    }
    
    // 비밀번호 검사
    if (!isValidPassword(password)) {
        showNotification('비밀번호는 영문자와 숫자를 포함하여 8-15자로 입력해주세요.', 'error');
        return false;
    }
    
    // 생년월일 검사
    if (!isValidAge(age)) {
        showNotification('올바른 생년월일을 입력해주세요. (YYYYMMDD 형식)', 'error');
        return false;
    }
    
    // 성별 검사
    if (gender === null || gender === undefined || gender === '') {
        showNotification('성별을 선택해주세요.', 'error');
        return false;
    }
    
    // 국가 검사
    if (!isoCode) {
        showNotification('국가를 선택해주세요.', 'error');
        return false;
    }
    
    // 이용약관 동의 검사
    if (!agreeTerms) {
        showNotification('이용약관에 동의해주세요.', 'error');
        return false;
    }
    
    return true;
}

// 휴대폰번호 유효성 검사
function isValidPhoneNumber(phoneNumber) {
    return /^01[0-9]{8,9}$/.test(phoneNumber);
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

// 생년월일 유효성 검사
function isValidAge(age) {
    if (!age || isNaN(age)) return false;
    
    const ageStr = age.toString();
    if (ageStr.length !== 8) return false;
    
    const year = parseInt(ageStr.substring(0, 4));
    const month = parseInt(ageStr.substring(4, 6));
    const day = parseInt(ageStr.substring(6, 8));
    
    // 연도 범위 검사 (1900년 ~ 현재년도 + 1년)
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) return false;
    
    // 월 범위 검사
    if (month < 1 || month > 12) return false;
    
    // 일 범위 검사 (각 월의 실제 일수 고려)
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // 윤년 처리
    if (month === 2) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (isLeapYear) {
            daysInMonth[2] = 29;
        }
    }
    
    if (day < 1 || day > daysInMonth[month]) return false;
    
    return true;
}

// 회원가입 처리
async function handleSignup(name, phoneNumber, password, age, gender, isoCode) {
    try {
        const response = await fetch('http://localhost:8080/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phoneNumber: phoneNumber,
                password: password,
                age: age,
                gender: gender,
                isoCode: isoCode
            })
        });
        
        const data = await response.json();
        
        if (response.status === 201) {
            // 회원가입 성공
            showNotification('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            
            // 로그인 페이지로 리다이렉트
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
        } else {
            // 회원가입 실패 - 서버에서 보낸 메시지 표시
            let errorMessage = '회원가입에 실패했습니다.';
            
            if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            } else if (data.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.join(', ');
            }
            
            showNotification(errorMessage, 'error');
            console.error('서버 응답:', data);
        }
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// 비밀번호 표시/숨김 토글
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
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

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    // Enter 키로 폼 제출 (이미 form의 submit 이벤트로 처리됨)
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        // Enter 키 처리는 form의 submit 이벤트에서 처리됨
    }
});

// 입력 필드 실시간 유효성 검사
document.getElementById('phoneNumber').addEventListener('input', function(e) {
    const value = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = value;
});

document.getElementById('age').addEventListener('input', function(e) {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 8) {
        e.target.value = value.substring(0, 8);
    }
});

// 이용약관 링크 (개발용)
document.querySelectorAll('.terms-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('이용약관 페이지는 현재 개발 중입니다.', 'warning');
    });
});

// 디버깅용 콘솔 로그
console.log('URLive 회원가입 페이지가 로드되었습니다.');
console.log('회원가입 API: http://localhost:8080/user'); 