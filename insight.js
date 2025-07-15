// Chart.js를 Apache ECharts로 전환한 버전
let dateChartInstance, refererChartInstance, deviceChartInstance;

document.addEventListener('DOMContentLoaded', () => {
    if (dateChartInstance) { dateChartInstance.dispose(); }
    if (refererChartInstance) { refererChartInstance.dispose(); }
    if (deviceChartInstance) { deviceChartInstance.dispose(); }

    dateChartInstance = echarts.init(document.getElementById('dateChart'));
    refererChartInstance = echarts.init(document.getElementById('refererChart'));
    deviceChartInstance = echarts.init(document.getElementById('deviceChart'));

    const params = new URLSearchParams(window.location.search);
    const shortUrlCode = params.get('shortUrlCode');
    const insightContainer = document.getElementById('insightContainer');
    const timeRangeFilter = document.getElementById('timeRangeFilter');

    if (shortUrlCode) {
        timeRangeFilter.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                timeRangeFilter.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                e.target.classList.add('active');
                const days = e.target.dataset.days;

                //쿼리 파라미터 업데이트 (브라우저 히스토리 변경, 페이지 리로드  없음)
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('days', days);
                window.history.pushState({ path: newUrl.href }, '', newUrl.href);

                fetchAndDisplayStats(shortUrlCode, days);
            }
        });
        const currentDays = params.get('days') || 7;
        const initialActiveLi = timeRangeFilter.querySelector(`li[data-days="${currentDays}"]`);
        if (initialActiveLi) {
            timeRangeFilter.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            initialActiveLi.classList.add('active');
        }
        fetchAndDisplayStats(shortUrlCode, currentDays);
    } else {
        insightContainer.innerHTML = `
            <h3>오류</h3>
            <p style="text-align: center; color: red;">
                통계 정보를 표시할 URL을 찾을 수 없습니다. 대시보드로 돌아가 다시 시도해주세요.
            </p>`;
    }
});

async function fetchAndDisplayStats(shortUrlCode, days) {
    const loadingMessage = document.getElementById('loadingMessage');
    const statsGrid = document.querySelector('.stats-grid');
    const sidebar = document.querySelector('.insight-sidebar');

    sidebar.classList.add('loading');
    if (loadingMessage) {
        loadingMessage.textContent = '통계 데이터를 불러오는 중입니다...';
        loadingMessage.style.color = '#666';
        loadingMessage.style.display = 'block';
    }
    // 데이터 로딩 중 차트 컨테이너 임시 숨김 (또는 로딩 스켈레톤 표시)
    document.getElementById('dateChart').style.display = 'none';
    document.getElementById('refererChart').style.display = 'none';
    document.getElementById('deviceChart').style.display = 'none';
    // "유입량 없음" 메시지 컨테이너들을 초기화
    document.getElementById('dateChartNoData').style.display = 'none';
    document.getElementById('refererChartNoData').style.display = 'none';
    document.getElementById('deviceChartNoData').style.display = 'none';

    if (statsGrid) statsGrid.style.display = 'none';

    try {
        const [dateData, refererData, deviceData] = await Promise.all([
            fetchApiData(shortUrlCode, 'date', days),
            fetchApiData(shortUrlCode, 'referer', days),
            fetchApiData(shortUrlCode, 'device', days)
        ]);

        if (loadingMessage) loadingMessage.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'grid';

        // 차트 컨테이너 다시 표시
        document.getElementById('dateChart').style.display = 'block';
        document.getElementById('refererChart').style.display = 'block';
        document.getElementById('deviceChart').style.display = 'block';

        // 각 차트에 days 값 전달
        renderDateChart(dateData, days);
        renderRefererChart(refererData, days); // days 인자 추가
        renderDeviceChart(deviceData, days); // days 인자 추가 (필요하다면)
    } catch (error) {
        console.error('통계 데이터 로드 중 오류 발생:', error);
        if (loadingMessage) {
            loadingMessage.textContent = error.message;
            loadingMessage.style.color = 'red';
        }
        // 에러 발생 시 모든 차트 컨테이너 숨김
        document.getElementById('dateChart').style.display = 'none';
        document.getElementById('refererChart').style.display = 'none';
        document.getElementById('deviceChart').style.display = 'none';
    } finally {
        sidebar.classList.remove('loading');
    }
}

async function fetchApiData(shortUrlCode, endpoint, days) {
    const apiUrl = `http://localhost:8080/user-urls/${shortUrlCode}/${endpoint}?days=${days}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`${endpoint} 통계 데이터를 불러오는데 실패했습니다.`);
    const result = await response.json();
    if (result.code !== 200) throw new Error(result.message || `${endpoint} 데이터 형식이 올바르지 않습니다.`);
    return result.data;
}

function renderDateChart(apiData, days) {
    const chartDom = document.getElementById('dateChart');
    const noDataMessageDom = document.getElementById('dateChartNoData'); 

    const hasAnyData = apiData.some(item =>
        Object.values(item.stats).some(count => count > 0)
    );

    if (!hasAnyData) {
        chartDom.style.display = 'none'; // 차트 숨김
        noDataMessageDom.style.display = 'block'; // 메시지 표시
        return;
    } else {
        chartDom.style.display = 'block'; // 차트 표시
        noDataMessageDom.style.display = 'none'; // 메시지 숨김
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
                rotate: days >= 0 ? 70 : 0,
                fontSize: 12,
                color: '#666'
            }
        },
        yAxis: { 
            type: 'value', 
            min: 0,
            interval: 10,
            max: Math.ceil(maxCount / 10) * 10 || 10,
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
    dateChartInstance.setOption(option);
    dateChartInstance.resize();
}

// renderRefererChart 함수 수정
function renderRefererChart(apiData, days) { // days 인자 추가
    const chartDom = document.getElementById('refererChart');
    const noDataMessageDom = document.getElementById('refererChartNoData'); // No data 메시지용 별도 DOM

    const hasAnyData = apiData.some(item =>
        Object.values(item.stats).some(count => count > 0)
    );

    if (!hasAnyData) {
        chartDom.style.display = 'none';
        noDataMessageDom.style.display = 'block';
        return;
    } else {
        chartDom.style.display = 'block';
        noDataMessageDom.style.display = 'none';
    }

    const { xAxis, referers, grouped } = groupRefererByInterval(apiData, days);

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
        legend: { data: referers },
        grid: { top: 80, left: '2%', right: '3%', bottom: '5%', containLabel: true },
        barCategoryGap: '35%',
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxis,
            axisLabel: {
                interval: 0,
                rotate: days >= 0 ? 70: 0, // days 인자 활용
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
    refererChartInstance.setOption(option, true);
    refererChartInstance.resize();
}

function groupRefererByInterval(apiData, days) {
    const xAxis = apiData.map(item => item.range);
    const refererSet = new Set();

    apiData.forEach(item => {
        Object.keys(item.stats).forEach(k => refererSet.add(k));
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


// renderDeviceChart 함수 수정
function renderDeviceChart(apiData, days) { // days 인자 추가 (필요하다면)
    const chartDom = document.getElementById('deviceChart');
    const noDataMessageDom = document.getElementById('deviceChartNoData'); // No data 메시지용 별도 DOM

    const hasAnyData = apiData.some(item =>
        Object.values(item.stats).some(count => count > 0)
    );

    if (!hasAnyData) {
        chartDom.style.display = 'none';
        noDataMessageDom.style.display = 'block';
        return;
    } else {
        chartDom.style.display = 'block';
        noDataMessageDom.style.display = 'none';
    }

    // 기존 인스턴스에 setOption만 호출하여 데이터 업데이트
    const deviceCountMap = {};
    for (const item of apiData) {
        const stats = item.stats;
        for (const device in stats) {
            deviceCountMap[device] = (deviceCountMap[device] || 0) + stats[device];
        }
    }

    deviceChartInstance.setOption({
        tooltip: { trigger: 'item' },
        legend: { 
            top: '0.3%',           // 위쪽 여백 확보
            left: 'center',      // 가운데 정렬
            orient: 'horizontal',
            itemGap: 10,         // 항목 간 간격
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
    }, true); // 두 번째 인자로 true를 넘겨서 이전 옵션과의 병합을 허용
    deviceChartInstance.resize();
}