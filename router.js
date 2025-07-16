// router.js
// URL 변경을 감지하고, 해당 URL에 맞는 페이지 컴포넌트를 렌더링

const router = async () => {
    const routes = [
        { 
            path: "/login", 
            // view 함수가 실제 페이지를 렌더링하는 비동기 함수를 반환하도록 수정
            view: async () => {
                const { default: LoginPage } = await import('/pages/LoginPage.js');
                return new LoginPage().getHtml(); // LoginPage 인스턴스의 getHtml 메서드 호출
            },
            js: async () => { // 페이지에 필요한 JS 로직을 담은 함수
                const { default: LoginPage } = await import('/pages/LoginPage.js');
                new LoginPage().executeScript(); // LoginPage 인스턴스의 executeScript 메서드 호출
            }
        },
        { 
            path: "/signup", 
            view: async () => {
                const { default: SignupPage } = await import('/pages/SignupPage.js');
                return new SignupPage().getHtml();
            },
            js: async () => {
                const { default: SignupPage } = await import('/pages/SignupPage.js');
                new SignupPage().executeScript();
            }
        },
        { 
            path: "/dashboard", 
            view: async () => {
                const { default: DashboardPage } = await import('/pages/DashboardPage.js');
                return new DashboardPage().getHtml();
            },
            js: async () => {
                const { default: DashboardPage } = await import('/pages/DashboardPage.js');
                new DashboardPage().executeScript();
            }
        },
        { 
            path: "/insight/:shortUrlCode", // shortUrlCode를 매개변수로 받음
            view: async () => {
                const { default: InsightPage } = await import('/pages/InsightPage.js');
                // URL에서 shortUrlCode 추출
                const pathParts = location.pathname.split('/');
                const shortUrlCode = pathParts[pathParts.indexOf('insight') + 1];
                // 쿼리 파라미터 추출
                const params = new URLSearchParams(location.search);
                const days = params.get('days');

                return new InsightPage(shortUrlCode, days).getHtml();
            },
            js: async () => {
                const { default: InsightPage } = await import('./pages/InsightPage.js');
                // URL에서 shortUrlCode 추출
                const pathParts = location.pathname.split('/');
                const shortUrlCode = pathParts[pathParts.indexOf('insight') + 1];
                // 쿼리 파라미터 추출
                const params = new URLSearchParams(location.search);
                const days = params.get('days');

                new InsightPage(shortUrlCode, days).executeScript();
            }
        },
        // 기본 경로 (로그인 여부에 따라 리다이렉션)
        { 
            path: "/", 
            view: async () => {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                const token = localStorage.getItem('authToken');
                
                if (isLoggedIn && token) {
                    navigateTo("/dashboard"); // 로그인 상태면 대시보드로
                    return ""; // 바로 리다이렉트되므로 빈 문자열 반환
                } else {
                    navigateTo("/login"); // 아니면 로그인 페이지로
                    return ""; // 바로 리다이렉트되므로 빈 문자열 반환
                }
            }
        },
        // 404 Not Found 페이지
        { 
            path: "/404", 
            view: () => `
                <div style="text-align: center; padding: 50px;">
                    <h1>404 Not Found</h1>
                    <p>페이지를 찾을 수 없습니다. <a href="/" data-link>홈으로 돌아가기</a></p>
                </div>
            `
        }
    ];

    const currentPath = location.pathname;
    let matchedRoute = null;

    for (let route of routes) {
        // 정규식을 사용하여 경로 매칭 (매개변수 포함)
        const pathRegex = new RegExp(`^${route.path.replace(/:\w+/g, '([^/]+)')}$`);
        if (currentPath.match(pathRegex)) {
            matchedRoute = route;
            break;
        }
    }

    if (!matchedRoute) {
        matchedRoute = routes.find(route => route.path === "/404");
    }

    // #app 컨테이너에 HTML 렌더링
    document.querySelector("#app").innerHTML = await matchedRoute.view();

    // 해당 페이지에 필요한 JS 코드 실행
    if (matchedRoute.js) {
        await matchedRoute.js();
    }
};

// 웹 페이지의 URL을 변경하면서 페이지를 새로고침하지 않고 
// 새로운 URL에 맞는 화면에 표시하는 역할
//url이 주소창에서 변경되면 route()함수 호출
const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

// 브라우저의 뒤로 가기/앞으로 가기 버튼 처리
window.addEventListener("popstate", router);

// DOMContentLoaded 시점에 라우터 시작 및 링크 클릭 이벤트 위임
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault(); // 기본 링크 동작 방지
            navigateTo(e.target.href);
        }
    });

    router(); // 초기 페이지 로드 시 라우터 실행
});