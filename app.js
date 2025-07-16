// index.html -> app.js

// router.js에서 navigateTo 함수를 전역으로 사용할 수 있게 임포트 (router.js가 DOMContentLoaded를 처리)
import { router, navigateTo } from './router.js'; 

// 전역 알림 함수 (선택 사항, Notification 컴포넌트로 만들 수도 있음)
export function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // 알림 컨테이너가 없으면 동적으로 생성 (만약 로그인/회원가입 페이지에만 있다면 해당 페이지에서 직접 처리)
    if (!notification) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<div id="notification" class="notification hidden"><span id="notificationMessage"></span></div>`;
        document.body.appendChild(tempDiv.firstChild);
        return showNotification(message, type); // 재귀 호출
    }

    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// 💡 여기서 특별히 초기화할 것이 많지 않다면 router.js의 DOMContentLoaded 리스너로 충분합니다.
// 이 파일은 추후 전역 상태 관리나 유틸리티 함수들을 모아두는 용도로 활용할 수 있습니다.