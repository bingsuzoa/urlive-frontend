
// ULIVE-FRONTEND/js/api.js

// URL 목록 가져오기
export async function fetchUserUrls(userId) {
    if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    const response = await fetch(`http://15.164.73.228:8080/users/${userId}/urls`);
    const data = await response.json();

    if (!response.ok || data.code !== 200) {
        throw new Error(data.message || 'URL 목록을 불러오는 데 실패했습니다.');
    }

    if (!data.data) {
        return []; // 데이터가 없는 경우 빈 배열 반환
    }

    return data.data;
}

// URL 단축하기
export async function createShortUrl(userId, originalUrl) {
    if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    const response = await fetch(`http://15.164.73.228:8080/users/${userId}/urls`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl: originalUrl })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'URL을 단축하는 데 실패했습니다.');
    }

    return data.data;
}

// 비밀번호 변경 API (DashboardPage에서 사용될 것으로 예상)
export async function updatePassword(userId, newPassword) {
    if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
    }
    const response = await fetch(`http://15.164.73.228:8080/user/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawNewPassword: newPassword })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || '비밀번호 변경에 실패했습니다.');
    }
    return data;
}

// URL 제목 수정 API (DashboardPage에서 사용될 것으로 예상)
export async function updateUrlTitle(userUrlId, newTitle) {
    const response = await fetch(`http://15.164.73.228:8080/user-urls/${userUrlId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newTitle: newTitle })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || '제목 수정에 실패했습니다.');
    }
    return data;
}

// URL 삭제 API (DashboardPage에서 사용될 것으로 예상)
export async function deleteUserUrl(userUrlId) {
    const response = await fetch(`http://15.164.73.228:8080/user-urls/${userUrlId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    // DELETE 요청은 보통 응답 바디가 없을 수 있으므로, response.json() 전에 확인
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류' }));
        throw new Error(errorData.message || 'URL 삭제에 실패했습니다.');
    }
    // 성공 시 특별히 반환할 데이터가 없으므로 그대로 종료
    return { success: true };
}

// 국가 목록 가져오기 (SignupPage에서 사용될 것으로 예상)
export async function fetchCountries() {
    const response = await fetch('http://15.164.73.228:8080/countries', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    const data = await response.json();
    if (!response.ok || data.code !== 200) {
        throw new Error(data.message || '국가 목록을 불러오는 데 실패했습니다.');
    }
    return data.data;
}

// 회원가입 API (SignupPage에서 사용될 것으로 예상)
export async function signupUser(userData) {
    const response = await fetch('http://15.164.73.228:8080/user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
        // 서버 응답이 성공(2xx)이 아닐 때
        // data.message가 있으면 사용하고, 없으면 data.errors 배열을 join하여 사용
        // 그것마저 없으면 '회원가입에 실패했습니다.'라는 기본 메시지 사용
        throw new Error(data.message || (data.errors && data.errors.join(', ')) || '회원가입에 실패했습니다.');
    }
    return data;
}

// 로그인 API (LoginPage에서 사용될 것으로 예상)
export async function loginUser(phoneNumber, password) {
    const response = await fetch('http://15.164.73.228:8080/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
    });
    const data = await response.json();
    if (!response.ok || data.code !== 200) {
        throw new Error(data.message || '로그인에 실패했습니다.');
    }
    return data;
}