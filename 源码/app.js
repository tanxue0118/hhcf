const APP = {
    targets: { calories: 1674, protein: 147, carbs: 167, fat: 47 },
    intake: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    meals: { breakfast: null, lunch: null, dinner: null, snack: null }
};

const API_KEY = '填写你的deepseek key';
const HEIGHT = 身高;
const AGE = 年龄;
const LOVE_DATE = new Date('年-月-日');  #在一起的时间

// JSONBIN配置
const JSONBIN_ID = 'JSONBIN ID';
const JSONBIN_KEY = 'key';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

let calYear, calMonth, selectedDate = null;
let cloudRecords = {};
let isLoadingCloud = false;

document.addEventListener('DOMContentLoaded', async () => {
    initLove();
    loadSaved();
    calcTargets();
    bindInputs();
    getWeather();
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    
    // 从云端加载数据
    await loadFromCloud();
    
    // 迁移本地缓存到云端
    migrateLocalToCloud();
    
    loadToday();
    renderCalendar();
});

// 迁移本地缓存数据到云端
function migrateLocalToCloud() {
    const localRecords = JSON.parse(localStorage.getItem('records') || '{}');
    const localKeys = Object.keys(localRecords);
    
    if (localKeys.length === 0) return;
    
    let hasNew = false;
    localKeys.forEach(date => {
        // 如果云端没有这一天的数据，就把本地的迁移过去
        if (!cloudRecords[date]) {
            const r = localRecords[date];
            // 转换成中文字段格式
            cloudRecords[date] = {
                '日期': date,
                '体重': r.weight || '',
                '目标': {
                    '热量': r.targets?.calories || 1674,
                    '蛋白质': r.targets?.protein || 147,
                    '碳水': r.targets?.carbs || 167,
                    '脂肪': r.targets?.fat || 47
                },
                '摄入': {
                    '热量': Math.round(r.intake?.calories || 0),
                    '蛋白质': Math.round(r.intake?.protein || 0),
                    '碳水': Math.round(r.intake?.carbs || 0),
                    '脂肪': Math.round(r.intake?.fat || 0)
                },
                '饮食': {
                    '早餐': r.meals?.breakfast || '',
                    '午餐': r.meals?.lunch || '',
                    '晚餐': r.meals?.dinner || '',
                    '加餐': r.meals?.snack || ''
                }
            };
            hasNew = true;
        }
    });
    
    if (hasNew) {
        saveToCloud();
        console.log('本地数据已迁移到云端');
        toast('历史记录已同步到云端 ✨');
    }
}

// 从JSONBIN读取数据
async function loadFromCloud() {
    isLoadingCloud = true;
    try {
        const res = await fetch(JSONBIN_URL + '/latest', {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        if (res.ok) {
            const data = await res.json();
            cloudRecords = data.record?.records || {};
            console.log('云端数据加载成功');
        }
    } catch(e) {
        console.log('云端加载失败，使用本地数据', e);
        cloudRecords = JSON.parse(localStorage.getItem('records') || '{}');
    }
    isLoadingCloud = false;
}

// 保存到JSONBIN
async function saveToCloud() {
    try {
        const res = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify({ records: cloudRecords })
        });
        if (res.ok) {
            console.log('云端保存成功');
        }
    } catch(e) {
        console.log('云端保存失败', e);
    }
    // 同时保存到本地作为备份
    localStorage.setItem('records', JSON.stringify(cloudRecords));
}

// 纪念日
function initLove() {
    const days = Math.floor((new Date() - LOVE_DATE) / 86400000);
    document.getElementById('love-days').textContent = `爱你的第 ${days} 天`;
    document.getElementById('love-num').textContent = days;
}

// 天气
const WEATHER_ZH = {
    'Sunny':'晴天','Clear':'晴朗','Partly cloudy':'多云','Partly Cloudy':'多云',
    'Cloudy':'阴天','Overcast':'阴天','Mist':'薄雾','Fog':'雾',
    'Light rain':'小雨','Moderate rain':'中雨','Heavy rain':'大雨',
    'Light snow':'小雪','Moderate snow':'中雪','Heavy snow':'大雪',
    'Thundery outbreaks possible':'雷阵雨','Patchy rain possible':'可能有小雨',
    'Light rain shower':'阵雨','Moderate or heavy rain shower':'大阵雨',
    'Torrential rain shower':'暴雨','Patchy light drizzle':'毛毛雨',
    'Patchy light rain':'零星小雨','Patchy rain nearby':'附近有小雨'
};

async function getWeather() {
    let weatherData = null;
    try {
        const res = await fetch('https://wttr.in/填地址?format=j1');  #可以用经纬度，英文名，拼音
        if (res.ok) {
            const data = await res.json();
            const cur = data.current_condition[0];
            const hourly = data.weather?.[0]?.hourly || [];
            const temp = parseInt(cur.temp_C);
            const humidity = parseInt(cur.humidity);
            const code = cur.weatherCode;
            const descEn = cur.weatherDesc?.[0]?.value || '';
            const descZh = WEATHER_ZH[descEn] || descEn || '晴天';
            const hourlyInfo = hourly.map(h => ({
                time: parseInt(h.time) / 100,
                temp: parseInt(h.tempC),
                desc: WEATHER_ZH[h.weatherDesc?.[0]?.value] || h.weatherDesc?.[0]?.value || '',
                rain: parseInt(h.chanceofrain || 0)
            }));
            weatherData = { temp, humidity, descZh, code, hourly: hourlyInfo };
            document.getElementById('weather-temp').textContent = temp + '°';
            document.getElementById('weather-temp-lg').textContent = temp + '°';
            document.getElementById('weather-info').textContent = descZh;
            document.getElementById('weather-icon').textContent = getEmoji(code);
        }
    } catch(e) {}
    await generateTip(weatherData);
}

function getEmoji(code) {
    const c = String(code);
    if (c === '113') return '☀️';
    if (c === '116') return '⛅';
    if (c === '119' || c === '122') return '☁️';
    if (['176','263','266','293','296'].includes(c)) return '🌦️';
    if (['299','302','305','308'].includes(c)) return '🌧️';
    if (['386','389','392'].includes(c)) return '⛈️';
    return '🌤';
}

async function generateTip(weather) {
    const hour = new Date().getHours();
    const days = Math.floor((new Date() - LOVE_DATE) / 86400000);
    let info = '地址，晴天，25度';
    if (weather) {
        info = `地址，${weather.descZh}，${weather.temp}°C，湿度${weather.humidity}%`;
        const rainH = weather.hourly.filter(h => h.rain > 50);
        const coolH = weather.hourly.filter(h => h.temp < weather.temp - 3);
        if (rainH.length) info += `，${rainH.map(h => h.time + '点').join('、')}可能下雨`;
        if (coolH.length) info += `，${coolH.map(h => h.time + '点').join('、')}会降温`;
    }
    const prompt = `你是暖心男友，给女朋友发消息。她在地址。
天气：${info}，现在${hour}点，在一起${days}天。
生成30-50字暖心提醒，根据天气变化给建议（下雨带伞、降温加衣），语气温柔甜蜜，只返回内容。`;
    try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是暖心男友，只返回提醒内容。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8, max_tokens: 100
            })
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('weather-tip').textContent = data.choices[0].message.content.trim();
            return;
        }
    } catch(e) {}
    document.getElementById('weather-tip').textContent = '今天也要好好吃饭哦，想你~';
}

// 用DeepSeek生成饮食提示语
async function generateMealTip() {
    const intake = APP.intake;
    const targets = APP.targets;
    
    const prompt = `你是暖心男友，给女朋友分析饮食情况。

当前摄入：热量${Math.round(intake.calories)}kcal，蛋白质${Math.round(intake.protein)}g，碳水${Math.round(intake.carbs)}g，脂肪${Math.round(intake.fat)}g
目标摄入：热量${targets.calories}kcal，蛋白质${targets.protein}g，碳水${targets.carbs}g，脂肪${targets.fat}g

请根据当前摄入情况，生成一条40-60字的温馨提醒：
1. 如果还有剩余，鼓励继续吃，说明还能吃多少热量和蛋白质
2. 如果差不多达标，表扬一下
3. 如果超标了，温柔提醒，不要责怪
4. 语气要温柔甜蜜，像男朋友对女朋友说话
5. 只返回内容，不要其他文字`;

    try {
        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是暖心男友，只返回提醒内容。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8, max_tokens: 100
            })
        });
        if (res.ok) {
            const data = await res.json();
            const tip = data.choices[0].message.content.trim();
            showModal(tip);
        }
    } catch(e) {
        console.log('提示语生成失败', e);
    }
}

// 显示弹窗
function showModal(tip) {
    document.getElementById('modal-tip').textContent = tip;
    document.getElementById('tip-modal').style.display = 'flex';
}

// 关闭弹窗
function closeModal() {
    document.getElementById('tip-modal').style.display = 'none';
}

// 输入绑定
function bindInputs() {
    const w = document.getElementById('weight');
    w.addEventListener('input', () => { localStorage.setItem('weight', w.value); calcTargets(); });
    w.addEventListener('change', () => { localStorage.setItem('weight', w.value); calcTargets(); });
    ['breakfast','lunch','dinner','snack'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => localStorage.setItem('meal_' + id, el.value));
    });
}

function loadSaved() {
    const w = localStorage.getItem('weight');
    if (w) document.getElementById('weight').value = w;
    // 从云端加载今日食物（在loadFromCloud后会调用loadToday）
}

function calcTargets() {
    const w = parseFloat(document.getElementById('weight').value) || 默认体重; #填数字，因为体重是会变化的，所以填一个大概的就行
    const bmr = 10 * w + 6.25 * HEIGHT - 5 * AGE - 161;
    const t = bmr * 1.55 - 400;
    APP.targets = {
        calories: Math.round(t),
        protein: Math.round((t * 0.35) / 4),
        carbs: Math.round((t * 0.40) / 4),
        fat: Math.round((t * 0.25) / 9)
    };
    document.getElementById('t-cal').textContent = APP.targets.calories;
    document.getElementById('t-pro').textContent = APP.targets.protein;
    document.getElementById('t-carb').textContent = APP.targets.carbs;
    document.getElementById('t-fat').textContent = APP.targets.fat;
}

async function analyzeMeal(type) {
    const text = document.getElementById(type).value.trim();
    if (!text) return toast('请输入食物内容');
    showLoading(true);
    try {
        const result = await callAPI(text);
        APP.meals[type] = result;
        showResult(type, result);
        updateIntake();
        updateStats();
        autoSave();
        // 用DeepSeek生成提示语
        await generateMealTip();
    } catch(e) {
        toast('分析失败：' + e.message);
    } finally {
        showLoading(false);
    }
}

async function callAPI(food) {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: '只返回JSON' },
                { role: 'user', content: `分析食物营养，只返回JSON：${food}\n格式：{"items":[{"name":"食物名","amount":"份量","calories":数字,"protein":数字,"carbs":数字,"fat":数字}],"total":{"calories":数字,"protein":数字,"carbs":数字,"fat":数字}}` }
            ],
            temperature: 0.3, max_tokens: 800
        })
    });
    if (!res.ok) throw new Error('请求失败');
    const data = await res.json();
    const m = data.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('解析失败');
    return JSON.parse(m[0]);
}

function showResult(type, result) {
    const div = document.getElementById(type + '-result');
    const t = result.total;
    div.innerHTML = `
        <div class="tags">
            <span class="tag tag-cal">🔥 ${t.calories}kcal</span>
            <span class="tag tag-pro">蛋白质${t.protein}g</span>
            <span class="tag tag-carb">碳水${t.carbs}g</span>
            <span class="tag tag-fat">脂肪${t.fat}g</span>
        </div>
        <div class="tag-detail">${result.items.map(i => i.name + '(' + i.amount + ')').join('、')}</div>
    `;
    div.classList.add('show');
}

function updateIntake() {
    APP.intake = { calories:0, protein:0, carbs:0, fat:0 };
    Object.values(APP.meals).forEach(d => {
        if (d?.total) {
            APP.intake.calories += d.total.calories || 0;
            APP.intake.protein += d.total.protein || 0;
            APP.intake.carbs += d.total.carbs || 0;
            APP.intake.fat += d.total.fat || 0;
        }
    });
}

function updateStats() {
    const i = APP.intake, t = APP.targets;
    document.getElementById('s-cal').textContent = Math.round(i.calories);
    document.getElementById('s-pro').textContent = Math.round(i.protein);
    document.getElementById('s-carb').textContent = Math.round(i.carbs);
    document.getElementById('s-fat').textContent = Math.round(i.fat);
    setRing('ring-cal', i.calories, t.calories);
    setRing('ring-pro', i.protein, t.protein);
    setRing('ring-carb', i.carbs, t.carbs);
    setRing('ring-fat', i.fat, t.fat);
    setRem('r-cal', i.calories, t.calories, 'kcal');
    setRem('r-pro', i.protein, t.protein, 'g');
    setRem('r-carb', i.carbs, t.carbs, 'g');
    setRem('r-fat', i.fat, t.fat, 'g');
}

function setRing(id, cur, target) {
    document.getElementById(id).style.strokeDashoffset = 264 * (1 - Math.min(cur / target, 1));
}

function setRem(id, cur, target, unit) {
    const d = target - cur;
    document.getElementById(id).textContent = d > 0 ? `还差${Math.round(d)}${unit}` : `已超${Math.round(Math.abs(d))}${unit}`;
}

function autoSave() {
    const today = new Date().toISOString().split('T')[0];
    const r = {
        '日期': today,
        '体重': document.getElementById('weight').value,
        '目标': {
            '热量': APP.targets.calories,
            '蛋白质': APP.targets.protein,
            '碳水': APP.targets.carbs,
            '脂肪': APP.targets.fat
        },
        '摄入': {
            '热量': Math.round(APP.intake.calories),
            '蛋白质': Math.round(APP.intake.protein),
            '碳水': Math.round(APP.intake.carbs),
            '脂肪': Math.round(APP.intake.fat)
        },
        '饮食': {
            '早餐': document.getElementById('breakfast').value,
            '午餐': document.getElementById('lunch').value,
            '晚餐': document.getElementById('dinner').value,
            '加餐': document.getElementById('snack').value
        }
    };
    cloudRecords[today] = r;
    saveToCloud();
    renderCalendar();
}

function saveRecord() {
    autoSave();
    toast('已保存到云端 ✨');
}

function loadToday() {
    const today = new Date().toISOString().split('T')[0];
    const r = cloudRecords[today];
    if (!r) return;
    
    // 加载体重
    if (r['体重']) {
        document.getElementById('weight').value = r['体重'];
        localStorage.setItem('weight', r['体重']);
    }
    
    // 加载食物记录到输入框
    if (r['饮食']) {
        document.getElementById('breakfast').value = r['饮食']['早餐'] || '';
        document.getElementById('lunch').value = r['饮食']['午餐'] || '';
        document.getElementById('dinner').value = r['饮食']['晚餐'] || '';
        document.getElementById('snack').value = r['饮食']['加餐'] || '';
    }
    
    if (r['目标']) {
        APP.targets = {
            calories: r['目标']['热量'],
            protein: r['目标']['蛋白质'],
            carbs: r['目标']['碳水'],
            fat: r['目标']['脂肪']
        };
    }
    
    if (r['摄入']) {
        APP.intake = {
            calories: r['摄入']['热量'] || 0,
            protein: r['摄入']['蛋白质'] || 0,
            carbs: r['摄入']['碳水'] || 0,
            fat: r['摄入']['脂肪'] || 0
        };
    }
    
    document.getElementById('t-cal').textContent = APP.targets.calories;
    document.getElementById('t-pro').textContent = APP.targets.protein;
    document.getElementById('t-carb').textContent = APP.targets.carbs;
    document.getElementById('t-fat').textContent = APP.targets.fat;
    
    updateStats();
}

// 日历
function renderCalendar() {
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    const startDay = first.getDay();
    const totalDays = last.getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    document.getElementById('cal-title').textContent = `${calYear}年${calMonth + 1}月`;

    let html = '';
    const prevLast = new Date(calYear, calMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="cal-day other-month">${prevLast - i}</div>`;
    }
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const hasRecord = cloudRecords[dateStr];
        const isSelected = dateStr === selectedDate;
        let cls = 'cal-day';
        if (isToday) cls += ' today';
        if (hasRecord) cls += ' has-record';
        if (isSelected) cls += ' selected';
        html += `<div class="${cls}" onclick="selectDate('${dateStr}')">${d}</div>`;
    }
    const remaining = 42 - (startDay + totalDays);
    for (let d = 1; d <= remaining; d++) {
        html += `<div class="cal-day other-month">${d}</div>`;
    }

    document.getElementById('cal-days').innerHTML = html;
}

function changeMonth(delta) {
    calMonth += delta;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    selectedDate = null;
    document.getElementById('day-detail').style.display = 'none';
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    showDayDetail(dateStr);
}

function showDayDetail(dateStr) {
    const r = cloudRecords[dateStr];
    const detail = document.getElementById('day-detail');

    if (!r) {
        const d = new Date(dateStr + 'T00:00:00');
        const week = ['日','一','二','三','四','五','六'][d.getDay()];
        detail.innerHTML = `<div class="day-detail-title">${d.getMonth()+1}月${d.getDate()}日 周${week}</div><div class="empty-text" style="text-align:center;padding:16px 0;">暂无记录</div>`;
        detail.style.display = 'block';
        return;
    }

    const d = new Date(dateStr + 'T00:00:00');
    const week = ['日','一','二','三','四','五','六'][d.getDay()];
    const i = r['摄入'] || {};
    const t = r['目标'] || {};

    detail.innerHTML = `
        <div class="day-detail-title">${d.getMonth()+1}月${d.getDate()}日 周${week}</div>
        <div class="day-detail-stats">
            <div class="day-stat">🔥 热量 <strong>${i['热量']||0}</strong>/${t['热量']||'—'}kcal</div>
            <div class="day-stat">💪 蛋白质 <strong>${i['蛋白质']||0}</strong>/${t['蛋白质']||'—'}g</div>
            <div class="day-stat">⚡ 碳水 <strong>${i['碳水']||0}</strong>/${t['碳水']||'—'}g</div>
            <div class="day-stat">🫧 脂肪 <strong>${i['脂肪']||0}</strong>/${t['脂肪']||'—'}g</div>
        </div>
        <div class="day-meals">
            ${r['饮食']?.['早餐'] ? `<div><span>🌅 早餐：</span>${r['饮食']['早餐']}</div>` : ''}
            ${r['饮食']?.['午餐'] ? `<div><span>☀️ 午餐：</span>${r['饮食']['午餐']}</div>` : ''}
            ${r['饮食']?.['晚餐'] ? `<div><span>🌙 晚餐：</span>${r['饮食']['晚餐']}</div>` : ''}
            ${r['饮食']?.['加餐'] ? `<div><span>🍎 加餐：</span>${r['饮食']['加餐']}</div>` : ''}
        </div>
        <div class="day-actions">
            <button class="day-btn btn-load" onclick="loadRecord('${dateStr}')">加载</button>
            <button class="day-btn btn-del" onclick="delRecord('${dateStr}')">删除</button>
        </div>
    `;
    detail.style.display = 'block';
}

function loadRecord(date) {
    const r = cloudRecords[date];
    if (!r) return;
    if (r['体重']) { document.getElementById('weight').value = r['体重']; localStorage.setItem('weight', r['体重']); }
    
    if (r['饮食']) {
        document.getElementById('breakfast').value = r['饮食']['早餐'] || '';
        document.getElementById('lunch').value = r['饮食']['午餐'] || '';
        document.getElementById('dinner').value = r['饮食']['晚餐'] || '';
        document.getElementById('snack').value = r['饮食']['加餐'] || '';
    }
    
    if (r['目标']) {
        APP.targets = {
            calories: r['目标']['热量'],
            protein: r['目标']['蛋白质'],
            carbs: r['目标']['碳水'],
            fat: r['目标']['脂肪']
        };
    }
    
    if (r['摄入']) {
        APP.intake = {
            calories: r['摄入']['热量'] || 0,
            protein: r['摄入']['蛋白质'] || 0,
            carbs: r['摄入']['碳水'] || 0,
            fat: r['摄入']['脂肪'] || 0
        };
    }
    
    document.getElementById('t-cal').textContent = APP.targets.calories;
    document.getElementById('t-pro').textContent = APP.targets.protein;
    document.getElementById('t-carb').textContent = APP.targets.carbs;
    document.getElementById('t-fat').textContent = APP.targets.fat;
    updateStats();
    switchPage('home');
    toast('已加载 💕');
}

function delRecord(date) {
    if (!confirm('确定删除？')) return;
    delete cloudRecords[date];
    saveToCloud();
    selectedDate = null;
    document.getElementById('day-detail').style.display = 'none';
    renderCalendar();
    toast('已删除');
}

function switchPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
    window.scrollTo(0, 0);
    if (name === 'history') renderCalendar();
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 2000);
}
