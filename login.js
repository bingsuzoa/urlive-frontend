// DOM 요소들
const loginForm = document.getElementById('loginForm');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// 로그인 폼 제출 이벤트
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const password = document.getElementById('password').value;
    
    if (!phoneNumber || !password) {
        showNotification('휴대폰 번호와 비밀번호를 모두 입력해주세요.', 'error');
        return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        showNotification('올바른 휴대폰 번호 형식을 입력해주세요.', 'error');
        return;
    }
    
    await handleLogin(phoneNumber, password);
});

// 로그인 처리
async function handleLogin(phoneNumber, password) {
    try {
        const response = await fetch('http://localhost:8080/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.code === 200) {
            // 로그인 성공
            localStorage.setItem('authToken', data.token || 'logged-in');
            localStorage.setItem('userPhone', phoneNumber);
            localStorage.setItem('isLoggedIn', 'true');
            
            // 사용자 정보 저장
            if (data.data) {
                localStorage.setItem('userData', JSON.stringify(data.data));
                localStorage.setItem('userId', data.data.id);
                localStorage.setItem('userName', data.data.name);
                localStorage.setItem('userAge', data.data.age);
                localStorage.setItem('userGender', data.data.gender);
                localStorage.setItem('userIsoCode', data.data.countryDto?.isoCode);
            }
            
            showNotification(data.message || '로그인되었습니다!', 'success');
            
            // 단축 URL 생성 화면으로 리다이렉트
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } else {
            // 로그인 실패 - 서버에서 보낸 메시지 표시
            const errorMessage = data.message || '로그인에 실패했습니다.';
            showNotification(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showNotification('서버 연결에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// 휴대폰번호 유효성 검사
function isValidPhoneNumber(phoneNumber) {
    return /^01[0-9]{8,9}$/.test(phoneNumber);
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

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('authToken');
    
    if (isLoggedIn && token) {
        // 이미 로그인된 경우 대시보드로 리다이렉트
        window.location.href = '/dashboard.html';
    }
});

// 디버깅용 콘솔 로그
console.log('URLive 로그인 페이지가 로드되었습니다.');
console.log('로그인 API: http://localhost:8080/user'); 