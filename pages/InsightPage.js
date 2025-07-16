import { showNotification } from '../app.js'; 
import { navigateTo } from '../router.js'; 

class InsightPage {
    constructor() {
        this.timeRangeFilter = null;
        this.insightContainer = null;
        this.dateChartDom = null; // DOM 요소와 ECharts 인스턴스를 구분하기 위해 이름 변경
        this.refererChartDom = null;
        this.deviceChartDom = null;
        this.dateChartNoData = null;
        this.refererChartNoData = null;
        this.deviceChartNoData = null;
        this.loadingMessage = null;
        this.statsGrid = null; // 추가: stats-grid 요소도 멤버 변수로 관리
        this.insightSidebar = null; // 추가: sidebar 요소도 멤버 변수로 관리

        // ECharts 인스턴스도 클래스 멤버로 선언
        this.dateChartInstance = null;
        this.refererChartInstance = null;
        this.deviceChartInstance = null;

        this.shortUrlCode = null; // shortUrlCode도 클래스 멤버로 저장하여 쉽게 접근
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
                        <a href="/dashboard" class="change-password-btn" title="대시보드로 돌아가기" data-link>
                            <i class="fas fa-arrow-left"></i>
                            대시보드
                        </a>
                    </div>
                </div>
                <p class="tagline">URL 통계</p>
            </header>

            <main class="main insight-layout">
                <aside class="insight-sidebar">
                    <h4>기간</h4>
                    <ul id="timeRangeFilter">
                        <li class="active" data-days="0">Today</li>
                        <li data-days="1">Last 24 hours</li>
                        <li data-days="7">Last 7 days</li>
                        <li data-days="30">Last 30 days</li>
                        <li data-days="90">Last 90 days</li>
                        <li data-days="365">Last 1 year</li>
                    </ul>
                </aside>
                <div id="insightContainer" class="insight-main">
                    <div class="stats-grid" style="display: none;">
                        <div class="stat-card">
                            <h4>날짜별 유입량</h4>
                            <div class="chart-wrapper">
                                <div id="dateChart" style="width: 100%; height: 300px;"></div>
                                <div id="dateChartNoData" style="text-align: center; color: #888; font-size: 14px; padding-top: 130px; display: none;">
                                    유입량이 없어요🥹
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4>유입 경로</h4>
                            <div class="chart-wrapper">
                                <div id="refererChart" style="width: 100%; height: 300px;"></div>
                                <div id="refererChartNoData" style="text-align: center; color: #888; font-size: 14px; padding-top: 130px; display: none;">
                                    유입량이 없어요🥹
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4>접속 기기</h4>
                            <div class="chart-wrapper">
                                <div id="deviceChart" style="width: 100%; height: 300px;"></div>
                                <div id="deviceChartNoData" style="text-align: center; color: #888; font-size: 14px; padding-top: 130px; display: none;">
                                    유입량이 없어요🥹
                                </div>
                            </div>
                        </div>
                    </div>
                    <p id="loadingMessage" style="text-align: center; color: #666; font-style: italic; width: 100%; grid-column: 1 / -1;">통계 데이터를 불러오는 중입니다...</p>
                </div>
            </main>
        </div>
        `;
    }

    async executeScript() {
        // DOM 요소 초기화 (HTML이 렌더링된 후에 실행되어야 함)
        this.initDOMElements();

        // ECharts 인스턴스 초기화
        this.initChartInstances();

        const params = new URLSearchParams(window.location.search);
        this.shortUrlCode = params.get('shortUrlCode');    
        
        if (this.shortUrlCode) {
            // 시간 범위 필터 클릭 이벤트 리스너 등록
            // handleTimeRangeFilterClick 메서드를 직접 바인딩하고, shortUrlCode는 클로저로 전달
            this.timeRangeFilter.addEventListener('click', this.handleTimeRangeFilterClick.bind(this));
            
            // 초기 데이터 로드 및 차트 표시
            await this.initDataAndDisplayCharts();
        } else {
            // shortUrlCode가 없을 경우 오류 메시지 표시
            this.insightContainer.innerHTML = `
                <h3>오류</h3>
                <p style="text-align: center; color: red;">
                    통계 정보를 표시할 URL을 찾을 수 없습니다. 대시보드로 돌아가 다시 시도해주세요.
                </p>`;
        }
    }

    // DOM 요소 초기화 메서드
    initDOMElements() {
        this.timeRangeFilter = document.getElementById('timeRangeFilter');
        this.insightContainer = document.getElementById('insightContainer');
        this.dateChartDom = document.getElementById('dateChart');
        this.refererChartDom = document.getElementById('refererChart');
        this.deviceChartDom = document.getElementById('deviceChart');
        this.dateChartNoData = document.getElementById('dateChartNoData');
        this.refererChartNoData = document.getElementById('refererChartNoData');
        this.deviceChartNoData = document.getElementById('deviceChartNoData');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.statsGrid = document.querySelector('.stats-grid');
        this.insightSidebar = document.querySelector('.insight-sidebar');
    }

    // ECharts 인스턴스 초기화 메서드
    initChartInstances() {
        // 기존 인스턴스가 있다면 dispose (메모리 누수 방지)
        if (this.dateChartInstance) { this.dateChartInstance.dispose(); }
        if (this.refererChartInstance) { this.refererChartInstance.dispose(); }
        if (this.deviceChartInstance) { this.deviceChartInstance.dispose(); }

        // 새로운 인스턴스 초기화
        this.dateChartInstance = echarts.init(this.dateChartDom);
        this.refererChartInstance = echarts.init(this.refererChartDom);
        this.deviceChartInstance = echarts.init(this.deviceChartDom);
    }

    // 초기 데이터 로드 및 차트 표시 로직 (initDataLander 대체)
    async initDataAndDisplayCharts() {
        const params = new URLSearchParams(window.location.search);
        const currentDays = params.get('days') || '7'; // data-days는 문자열이므로 '7'로 비교

        // 초기 활성 li 설정
        if (this.timeRangeFilter) {
            const initialActiveLi = this.timeRangeFilter.querySelector(`li[data-days="${currentDays}"]`);
            if (initialActiveLi) {
                this.timeRangeFilter.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                initialActiveLi.classList.add('active');
            }
        }
        
        await this.fetchAndDisplayStats(this.shortUrlCode, currentDays);
    }

    // 시간 범위 필터 클릭 이벤트 핸들러
    handleTimeRangeFilterClick(e) {
        const clickedLi = e.target.closest('li'); // li 태그가 아닌 자식 요소를 클릭해도 li를 찾음

        if (clickedLi && clickedLi.dataset.days) { // data-days 속성이 있는 li만 처리
            this.timeRangeFilter.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            clickedLi.classList.add('active');
            const days = clickedLi.dataset.days;

            // 쿼리 파라미터 업데이트 (브라우저 히스토리 변경, 페이지 리로드 없음)
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('days', days);
            window.history.pushState({ path: newUrl.href }, '', newUrl.href);

            this.fetchAndDisplayStats(this.shortUrlCode, days);
        }
    }

    // 통계 데이터 가져오고 표시하는 메서드 (기존 전역 함수 대체)
    async fetchAndDisplayStats(shortUrlCode, days) {
        this.insightSidebar.classList.add('loading');
        if (this.loadingMessage) {
            this.loadingMessage.textContent = '통계 데이터를 불러오는 중입니다...';
            this.loadingMessage.style.color = '#666';
            this.loadingMessage.style.display = 'block';
        }
        
        // 데이터 로딩 중 차트 컨테이너 임시 숨김 (No Data 메시지도 숨김)
        this.dateChartDom.style.display = 'none';
        this.refererChartDom.style.display = 'none';
        this.deviceChartDom.style.display = 'none';
        this.dateChartNoData.style.display = 'none';
        this.refererChartNoData.style.display = 'none';
        this.deviceChartNoData.style.display = 'none';

        if (this.statsGrid) this.statsGrid.style.display = 'none';

        try {
            const [dateData, refererData, deviceData] = await Promise.all([
                this.fetchApiData(shortUrlCode, 'date', days),
                this.fetchApiData(shortUrlCode, 'referer', days),
                this.fetchApiData(shortUrlCode, 'device', days)
            ]);

            if (this.loadingMessage) this.loadingMessage.style.display = 'none';
            if (this.statsGrid) this.statsGrid.style.display = 'grid';

            // 차트 컨테이너 다시 표시 (데이터가 있을 경우 renderChart 함수에서 다시 숨겨짐)
            this.dateChartDom.style.display = 'block';
            this.refererChartDom.style.display = 'block';
            this.deviceChartDom.style.display = 'block';

            // 각 차트에 days 값 전달
            this.renderDateChart(dateData, days);
            this.renderRefererChart(refererData, days);
            this.renderDeviceChart(deviceData, days);
        } catch (error) {
            console.error('통계 데이터 로드 중 오류 발생:', error);
            showNotification(error.message, 'error'); // showNotification은 임포트된 전역 함수
            if (this.loadingMessage) {
                this.loadingMessage.textContent = error.message;
                this.loadingMessage.style.color = 'red';
            }
            // 에러 발생 시 모든 차트 컨테이너 숨김
            this.dateChartDom.style.display = 'none';
            this.refererChartDom.style.display = 'none';
            this.deviceChartDom.style.display = 'none';
        } finally {
            this.insightSidebar.classList.remove('loading');
        }
    }

    // API 데이터 가져오는 메서드 (기존 전역 함수 대체)
    async fetchApiData(shortUrlCode, endpoint, days) {
        const apiUrl = `http://15.164.73.228:8080/user-urls/${shortUrlCode}/${endpoint}?days=${days}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load ${endpoint} data: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        if (result.code !== 200) throw new Error(result.message || `${endpoint} 데이터 형식이 올바르지 않습니다.`);
        return result.data;
    }

    // 날짜별 차트 렌더링 메서드 (기존 전역 함수 대체)
    renderDateChart(apiData, days) {
        const hasAnyData = apiData.some(item =>
            Object.values(item.stats).some(count => count > 0)
        );

        if (!hasAnyData) {
            this.dateChartDom.style.display = 'none';
            this.dateChartNoData.style.display = 'block';
            return;
        } else {
            this.dateChartDom.style.display = 'block';
            this.dateChartNoData.style.display = 'none';
        }

        const dates = apiData.map(item => item.range);
        const counts = apiData.map(item => item.stats.count);
        const maxCount = Math.max(...counts);

        const option = {
            tooltip: { trigger: 'axis' },
            grid: { top: 20 },
            xAxis: { 
                type: 'category', 
                boundaryGap: false,
                data: dates,
                axisLabel: {
                    interval: 0,
                    rotate: (days === '0' || days === '1') ? 0 : 70, // '0' (Today) 또는 '1' (Last 24 hours) 일 경우 회전 안함
                    fontSize: 12,
                    color: '#666'
                }
            },
            yAxis: { 
                type: 'value', 
                min: 0,
                interval: 10,
                max: Math.ceil(maxCount / 10) * 10 || 10, // 최대값이 0이면 10으로 설정
                axisLabel: {
                    fontSize: 12,
                    color: '#666'
                },
                splitLine: { lineStyle: { color: '#eee' } }
            },
            series: [{
                name: '클릭 수',
                type: 'line',
                data: counts,
                smooth: true,
                areaStyle: {},
                lineStyle: {width: 2},
                itemStyle: {color: '#667eea'}
            }]
        };
        this.dateChartInstance.setOption(option);
        this.dateChartInstance.resize();
    }

    // 유입 경로 차트 렌더링 메서드 (기존 전역 함수 대체)
    renderRefererChart(apiData, days) {
        const hasAnyData = apiData.some(item =>
            Object.values(item.stats).some(count => count > 0)
        );

        if (!hasAnyData) {
            this.refererChartDom.style.display = 'none';
            this.refererChartNoData.style.display = 'block';
            return;
        } else {
            this.refererChartDom.style.display = 'block';
            this.refererChartNoData.style.display = 'none';
        }

        const { xAxis, referers, grouped } = this.groupRefererByInterval(apiData, days);

        const series = referers.map((referer) => ({
            name : referer,
            type : 'bar',
            stack : 'total',
            barWidth: '40%', 
            emphasis : { focus : 'series' },
            data : grouped[referer]
        }));

        const option = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: referers, top: '0.3%', left: 'center', orient: 'horizontal', itemGap: 10, width: '100%', padding: 0, textStyle: {fontSize: 12} }, // legend 옵션에 width, padding, textStyle 추가 (deviceChart와 통일)
            grid: { top: 80, left: '2%', right: '3%', bottom: '5%', containLabel: true },
            barCategoryGap: '35%',
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxis,
                axisLabel: {
                    interval: 0,
                    rotate: (days === '0' || days === '1') ? 0 : 70, // days 인자 활용
                    fontSize: 12,
                    color: '#666'
                }
            },
            yAxis: {
                type: 'value',
                min: 0,
                axisLabel: {
                    fontSize: 12,
                    color: '#666'
                },
                splitLine: {
                    lineStyle: { color: '#eee' }
                }
            },
            series
        };
        this.refererChartInstance.setOption(option, true);
        this.refererChartInstance.resize();
    }

    // 유입 경로를 간격별로 그룹화하는 메서드 (기존 전역 함수 대체)
    groupRefererByInterval(apiData, days) {
        const xAxis = apiData.map(item => item.range);
        const refererSet = new Set();

        apiData.forEach(item => {
            Object.keys(item.stats).forEach(k => {
                if (k !== 'count') { // 'count' 키는 제외
                    refererSet.add(k);
                }
            });
        });

        const referers  = Array.from(refererSet);

        const totalCounts = {};
        for(const r of referers) totalCounts[r] = 0;
        for(const item of apiData) {
            for(const r of referers) {
                totalCounts[r] += item.stats[r] || 0;
            }
        }

        referers.sort((a, b) => totalCounts[b] - totalCounts[a]);

        const grouped = {};
        for(const referer of referers) {
            grouped[referer] = apiData.map(item => item.stats[referer] || 0);
        }

        return {xAxis, referers, grouped}; 
    }

    // 접속 기기 차트 렌더링 메서드 (기존 전역 함수 대체)
    renderDeviceChart(apiData, days) { // days 인자는 현재 사용되지 않지만, 일관성을 위해 유지
        const hasAnyData = apiData.some(item =>
            Object.values(item.stats).some(count => count > 0)
        );

        if (!hasAnyData) {
            this.deviceChartDom.style.display = 'none';
            this.deviceChartNoData.style.display = 'block';
            return;
        } else {
            this.deviceChartDom.style.display = 'block';
            this.deviceChartNoData.style.display = 'none';
        }

        const deviceCountMap = {};
        for (const item of apiData) {
            const stats = item.stats;
            for (const device in stats) {
                if (device !== 'count') { // 'count' 키는 제외
                    deviceCountMap[device] = (deviceCountMap[device] || 0) + stats[device];
                }
            }
        }

        this.deviceChartInstance.setOption({
            tooltip: { trigger: 'item' },
            legend: { 
                top: '0.3%',           
                left: 'center',      
                orient: 'horizontal',
                itemGap: 10,         
                width: '100%',           
                padding: 0,  
                textStyle: {fontSize: 12}
            },
            series: [{
                name: '접속 기기',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                data: Object.entries(deviceCountMap).map(([name, value]) => ({ name, value }))
            }]
        }, true);
        this.deviceChartInstance.resize();
    }
}

export default InsightPage;