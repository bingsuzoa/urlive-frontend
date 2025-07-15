
//URL목록 가져오기
export async function fetchUserUrls(userId) {
    if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    const response = await fetch(`http://localhost:8080/users/${userId}/urls`);
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

    const response = await fetch(`http://localhost:8080/users/${userId}/urls`, {
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