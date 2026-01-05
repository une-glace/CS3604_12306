1. 首页与车票查询概述

    1.1 涉及组件与路由
        - 首页：/
        - 车票预订表单：BookingForm
        - 车次列表页：/train-list
        - 查询条件组件：SearchConditions
        - 筛选组件：FilterConditions
        - 车次展示组件：TrainList
        - 登录弹窗：LoginModal

2. 首页（/）

    2.1 顶部布局与样式

        2.1.1 品牌与搜索
            - 左侧：
              - Logo 图片：src="/铁路12306-512x512.png"，尺寸约40px×40px（HomePage.css:32-35）
              - 品牌文字：
                - 上行："中国铁路12306"，字号约22px，字体加粗，颜色为#333（HomePage.css:45）
                - 下行："12306 CHINA RAILWAY"，字号约12px，颜色为#999（HomePage.css:46）
              - Logo 与文字水平排列，整体垂直居中（HomePage.css:20-30）
            - 中间：
              - 搜索输入框位于头部中部区域，宽度占据中部可用空间
              - 输入框背景为白色，边框为浅灰色，预设占位符："搜索车票、 餐饮、 常旅客、 相关规章"
              - 右侧按钮文本为"Q"，按钮采用扁平风格，字号约14px，作为视觉占位（HomePage.css 中头部统一按钮样式）
            - 右侧：
              - 链接/按钮顺序："无障碍" | "敬老版" | "English" | "我的12306" | 登录/注册
              - 链接文字颜色为#666，hover 时变为#1890ff（HomePage.css:59-67）
              - 登录/注册按钮：
                - 使用`.login-btn`与`.register-btn`样式（HomePage.css:60-94）
                - 登录按钮：边框颜色与文字颜色为#0066cc，hover 时背景填充为#0066cc，文字变为白色
                - 注册按钮：边框与文字为中性灰色，hover 时背景为#f5f5f5，边框加深
              - 已登录状态：
                - 显示"您好，{用户姓名}"和"退出"按钮
                - 用户名按钮为蓝色文字并带下划线，hover 时颜色保持高亮（HomePage.css:73-81）
                - 退出按钮为灰色边框按钮，hover 时背景为#f5f5f5（HomePage.css:82-91）
                - 点击"退出"弹出浏览器confirm对话框，确认后调用logout并刷新页面

        2.1.2 导航栏
            - 使用Navbar组件，当前激活项为"home"
            - 整体高度约40px，背景为#3399FF（HomePage.css:113-120）
            - 导航项横向等分布局，每项文字白色，字号约14px（HomePage.css:121-134）
            - hover 或当前激活项时，导航项背景出现半透明白色高亮条（HomePage.css:135-141）

    2.2 轮播与车票预订区域与样式

        2.2.1 轮播图
            - 使用Carousel组件展示多张宣传图，铺满主视觉区域宽度（HomePage.tsx:35-43）
            - 图片资源：
              - "/homepage/Carousel/Carousel_1.jpg" ~ "/homepage/Carousel/Carousel_6.jpg"
            - 自动轮播，间隔约4秒（HomePage.tsx:35-43）
            - 轮播区域高度约为大屏全宽视觉高度，图片`object-fit: cover`，保证在不同分辨率下填充满容器（HomePage.css 中 Carousel 相关样式）

        2.2.2 车票预订面板（BookingForm）
            - 相对位置：
              - 使用`.hero-booking`容器将预订面板叠加在轮播图左下区域（HomePage.css:484-493）
              - 容器采用两列网格布局：左侧侧边标签列约60px，右侧表单卡片约450px，总宽约510px，高度约350px
            - 左侧垂直标签列（side-tabs）：
              - 背景为纯蓝色#2a76ff，文字白色，宽度约100px，高度填满350px（HomePage.css:495-508）
              - 当前仅保留"车票"一项标签，文字垂直居中，字号约16px，字体加粗
              - 选中态背景为半透明白色覆盖，形成浅浅高亮区（HomePage.css:509-512）
            - 右侧车票类型面板（ticket-panel）：
              - 面板宽约410px、高约350px，白色背景，顶部有约20px内边距（HomePage.css:514-526）
              - 四个车票类型标签行（ticket-tabs）：
                - 布局为水平排列，宽约360px，高约32px，居中于面板内（HomePage.css:528-536）
                - 每个标签宽约90px，高度32px，文本居中（HomePage.css:538-546）
                - 默认文字颜色为#666，背景透明，无边框，鼠标样式为默认（非可点击，仅"单程"高亮可用）
                - 选中态（"单程"）文字颜色为#2a76ff，字体加粗，并在底部有2px #2a76ff 下划线（HomePage.css:548-551）
                - 其他类型（"往返"、"中转换乘"、"退改签"）处于禁用状态，往往与代码逻辑中`disabled`保持一致
            - BookingForm 表单区域（嵌入于ticket-panel 内部）：
              - 宽度约360px，padding 为16px 20px 20px，整体无阴影、无圆角（HomePage.css:553-560）
              - 表单字段：
                - 出发地、目的地输入框：使用`.booking-form`内部样式，宽约340px，高约32px，左右内边距约10px，边框为1px 浅灰色（BookingForm.css:1-80）
                - 出发日期：`type="date"` 的输入框，高度30px，边框与城市输入一致
                - 交换按钮："⇄" 按钮使用圆形蓝色按钮，背景#0066cc，白色图标，hover 时变深为#0052a3（SearchConditions.css 中 `.swap-button` 样式，车票页采用一致视觉语言）
              - 校验规则：
                - 任一字段为空时，点击"查询"按钮弹出"请填写完整的出行信息"
                - 出发地与目的地相同，点击"查询"弹出"出发地和目的地不能相同"
            - 查询按钮：
              - 使用`.booking-form .search-button`样式（BookingForm.css:187-206）
              - 按钮宽度约340px，高度30px，位于表单底部中间
              - 默认背景为橙色渐变`#f79414`，文字白色，字体加粗
              - hover 时背景渐变变为蓝色系`#096dd9 ~ #0050b3`，按钮微微上浮并出现蓝色阴影

        2.2.3 查询行为
            - 当表单通过校验后：
              - 构造URL查询参数from、to、date
              - 调用navigate跳转到"/train-list?from={from}&to={to}&date={date}"

    2.3 首页服务与信息区域与样式

        2.3.1 快捷服务按钮
            - 布局：
              - 使用`.hero-service-row`容器，将按钮横向排列在轮播区下方（HomePage.tsx:151-159）
              - 按钮之间间距均匀，整体宽度限制在1200px 内，居中展示
            - 单个按钮（hero-service-btn）：
              - 采用扁平化蓝色按钮样式，背景为浅蓝或白色，边框为蓝色描边
              - 文字为深色，字号约14px，居中对齐
              - hover 时背景颜色略微加深，强调可点击性（HomePage.css 中 hero-service 相关样式）
            - 当前按钮仅为前端静态按钮，无实际跳转逻辑："重点旅客预约"、"遗失物品查找"、"约车服务"、"便民托运"等

        2.3.2 图文服务入口
            - 使用4张图片作为服务宣传：
              - "/homepage/service/abanner01.jpg"
              - "/homepage/service/abanner02.jpg"
              - "/homepage/service/abanner03.jpg"
              - "/homepage/service/abanner04.jpg"
            - 布局为2×2 栅格（.promo-grid），每个图卡宽约590px，高约160px，带圆角8px 和轻微阴影（HomePage.css:541-559）
            - 每个图卡使用背景图片填充，`background-size: cover`，`background-position: center`，用于展示不同服务内容

        2.3.3 通知栏
            - 选项卡："最新发布"、"常见问题"、"信用信息"
            - 点击不同选项卡会切换展示内容：
              - 最新发布：展示多条包含标题与日期的公告列表
              - 常见问题：以两列列表展示常见问题类型
              - 信用信息：展示失信被执行人相关信息的占位卡片，当前内容为"暂无法公开数据"

3. 车次列表页（/train-list）

    3.1 查询条件获取

        3.1.1 URL参数解析
            - 使用useSearchParams获取from、to、date
            - 若URL中无date，则默认使用当天日期
            - 若页面以改签模式进入（location.state.isChangeMode为true）：
              - 使用changeOrder中的departure/arrival或fromStation/toStation作为锁定的出发/到达站
              - Locked站点无法在SearchConditions组件中修改

        3.1.2 城市与车站映射（parseCityStationInput）
            - 当from或to为城市名时：
              - 调用parseCityStationInput，将城市映射为多个具体车站名称
              - 将解析结果存入fromStations/toStations，用于后续后端查询参数与筛选可选车站

    3.2 列车数据加载

        3.2.1 请求触发时机
            - fromStation或toStation发生变化
            - departureDate发生变化
            - fromStations或toStations筛选列表变化

        3.2.2 查询参数构造
            - 基础字段：
              - fromStation：出发地（城市或车站名）
              - toStation：目的地（城市或车站名）
              - departureDate：发车日期
            - 若fromStations/toStations数组非空：
              - 将其分别作为fromStations/toStations参数传给后端
            - 若查询日期为当天：
              - 计算当前时间，设置minDepartureTime，后端仅返回未发车车次

        3.2.3 后端响应映射（mapToTrainInfo）
            - 从SearchTrainItem映射为列表展示需要的TrainInfo字段：
              - 车次号、车次类型、出发站、到达站、发车时间、到达时间、历时
              - seats：按席别名建立可用性标记：
                - availableSeats>0 => "有"
                - isAvailable=true且无余票 => "候补"
                - 否则 => "无"
              - canBook：若任何席别有余票则为true，否则为false
              - isHighSpeed：车次类型为G或C时为true

        3.2.4 加载状态处理
            - 请求过程中：
              - loading=true，列表区域展示"正在查询车次信息..."及加载动画
            - 请求失败或from/to为空时：
              - filteredTrains与trains均置为空数组
              - 控制台输出错误信息，不中断页面运行

    3.3 查询条件组件（SearchConditions）

        3.3.1 展示内容与样式
            - 主体布局（.search-main）：
              - 背景为淡蓝色条（#eef6ff），边框为1px 实线 #cfe1ff，圆角6px（SearchConditions.css:5-16）
              - 内部采用网格布局：依次为行程类型列、站点选择区、日期选择区、乘客类型区、车次类型区、查询按钮
            - 行程类型列：
              - 在左侧使用竖直文本列展示"单程/往返"说明，字体约12px，颜色#333（SearchConditions.css:18-27）
            - 出发站/到达站输入：
              - 使用.station-input 样式，宽约122px，高约30px，边框为1px 浅灰#ddd，圆角4px（SearchConditions.css:52-62）
              - 文本字号约16px，加粗显示，placeholder 颜色为#999
              - focus 时边框变为#1890ff，并出现浅蓝色描边阴影（SearchConditions.css:64-71）
              - 未填写时会加上.invalid 类，边框与阴影变为红色（SearchConditions.css:73-78）
            - 交换按钮：
              - 圆形蓝色按钮，直径约36px，背景#0066cc，文字白色（SearchConditions.css:80-89）
              - hover 时背景加深为#0052a3
            - 日期选择：
              - 日期输入框高度约30px，圆角6px，边框为1px #d9d9d9（SearchConditions.css:103-112）
              - focus 时同样高亮为蓝色边框与浅蓝阴影
              - 在改签模式下会使用.disabled 样式：背景变为#f5f5f5，文字#aaa，禁止编辑（SearchConditions.css:114-120）
            - 乘客类型与车次类型：
              - 标签文字字号约12px，颜色#666
              - 下方为单选按钮组，排成一行或一列（SearchConditions.css:122-151）
            - 查询按钮：
              - 使用.search-button 样式，背景为橙色#ff6600，文字白色，圆角4px，高度约30px（SearchConditions.css:153-162）
              - hover 时背景变为更深的橙色#e55a00

        3.3.2 条件改变行为（handleConditionsChange）
            - 用户修改条件后：
              - 在非改签模式下，允许修改出发站与到达站
              - 在改签模式下，仅允许修改日期，站点锁定
              - 将最新条件写入URL查询参数并使用replace=true更新路由

        3.3.3 车站筛选联动与城市选择弹层
            - onStationFilterChange回调：
              - 更新fromStations和toStations状态
              - 触发useEffect重新请求后端数据
            - 城市选择弹层（station-dropdown）：
              - 当点击城市站点输入时，在输入框下方弹出宽约860px 的白色弹层（SearchConditions.css:216-233）
              - 左侧为范围选择列（scope-column），背景为浅灰蓝#f5f7fb，包含"境内"、"境外"按钮
              - 右侧为城市列表区域，顶部有城市分类标签（如"热门"、"ABCDE"等），当前标签为蓝底白字的按钮（SearchConditions.css:234-260）
              - 城市列表以6列栅格形式展示，城市按钮为无边框文字按钮，hover 时文字高亮为#2a76ff（SearchConditions.css:262-272）

    3.4 横向筛选组件（FilterConditions）

        3.4.1 支持的筛选项
            - 发车时间区间（例如"00:00-24:00"、"06:00-12:00"等）
            - 车次类型（GC、D、Z、T、K、复兴号/智能动车组、其他）
            - 出发车站
            - 到达车站
            - 席别类型（商务、一等、二等、硬座、硬卧等）

        3.4.2 筛选逻辑
            - 发车时间：
              - 根据区间过滤fromTime字段
            - 车次类型：
              - 根据trainType字段判断是否属于所选类型集合
            - 出发/到达车站：
              - 若用户选择了所有车站，则不作过滤
              - 否则仅保留车站在所选集合内的车次
            - 席别：
              - 使用seatKeyMap映射筛选值到seats字段Key
              - 至少有一个席别的值不为0且不为"无"时，该车次保留

    3.5 车次列表与预订流程

        3.5.1 列表展示与样式
            - 顶部头部栏（train-list-header）：
              - 背景为深蓝色渐变条（#2f7fd6），底部有2px 较深蓝边框（TrainList.css:5-13）
              - 各列标题采用白色文字，字号约13px，左右有适度内边距
              - 可排序列（车次号、时间、历时）在hover时出现浅色背景（TrainList.css:23-34）
            - 列车行（train-row）：
              - 每行高度约40.5px，左右对齐的flex 布局（TrainList.css:57-72）
              - 奇偶行背景交错：白色与浅蓝#f0f8ff，hover 时统一高亮为#f8f9fa
            - 车次信息区（train-info）：
              - 左侧显示车次号与车次类型徽标：
                - 类型徽标（train-type）使用彩色圆角矩形，文字白色、字号约14px（TrainList.css:99-162）
              - 中部展示出发/到达站名称与时间，采用上下两行布局
            - 席别列：
              - 每个席别占用宽度约66px，文字居中（TrainList.css:142-154, 219-228）
              - 可用状态展示为"有"或"{N}张"，并按颜色区分：
                - 有票（seat-available）：绿色#00aa44，加粗
                - 无票（seat-unavailable）："无"，灰色#ccc
                - 候补（seat-waitlist）："候补"，橙色#ff6600，加粗（TrainList.css:230-242）
            - 操作区：
              - 右侧按钮"预订"使用.book-button 样式：
                - 背景为蓝色#0066cc，文字白色，圆角4px，高度约24px（TrainList.css:252-262）
                - hover 时背景变深为#0052a3
                - 无票状态下按钮会使用.disabled 样式，背景灰色且鼠标为不可点击形态

        3.5.2 选择车次（handleTrainSelect）
            - 未登录时：
              - 弹出LoginModal登录框
              - 记录当前选中的车次为selectedTrain
            - 已登录时：
              - 直接调用navigateToOrder跳转到订单页面

        3.5.3 登录弹窗回调（handleLoginSuccess）
            - 登录成功后：
              - 关闭LoginModal
              - 若之前有选中的车次：
                - 调用navigateToOrder(selectedTrain)
                - 清空selectedTrain

        3.5.4 跳转至订单页面（navigateToOrder）
            - 基于所选车次构造订单页面查询参数：
              - trainNumber、from、to、departureTime、arrivalTime、date、duration
              - seatType：默认"二等座"
              - price：默认"553"
            - 若处于改签模式：
              - 使用navigate跳转至"/order"，同时保留location.state中原订单信息及isChangeMode标记
            - 非改签模式：
              - 直接跳转至"/order?..."，进入新购票流程

4. 场景示例

    4.1 从首页查询车次并跳转到车次列表
        Scenario: 用户在首页填写完整出行信息并发起查询
            Given 用户在首页看到"出发地"、"目的地"与"出发日期"输入框
            And 用户将"出发地"填写为"北京"
            And 用户将"目的地"填写为"上海"
            And 用户选择了距今30天内的某个日期
            When 用户点击"查询"按钮
            Then 系统校验所有字段均已填写且出发地与目的地不同
            And 系统跳转到"/train-list"页面
            And URL中包含from、to与date查询参数

    4.2 在车次列表页筛选高铁车次
        Scenario: 用户在车次列表页选择仅查看高铁车次
            Given 用户已在"/train-list"页面看到查询结果列表
            And 页面顶部展示出发地、目的地与日期信息
            When 用户在筛选栏中勾选车次类型"GC"
            Then 系统根据车次类型过滤列表数据
            And 列表中仅保留G字头或C字头的高铁动车车次
