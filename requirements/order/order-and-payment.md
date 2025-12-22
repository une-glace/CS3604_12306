1. 车票订单与支付模块概述

    1.1 涉及页面与组件
        - 订单填写页：/order
        - 支付页：/pay-order
        - 订单详情页：/order-detail/:orderId
        - 退票成功页：/refund-success
        - 乘车人弹窗：AddPassengerModal
        - 下单确认弹窗：OrderConfirmModal
        - 改签确认弹窗：ChangeTicketConfirmModal
        - 下单处理中态：OrderProcessing
        - 支付弹窗：PaymentModal

2. 订单填写页（/order）

    2.1 入口与路由参数

        2.1.1 普通购票入口
            - 从车次列表页点击"预订"进入：
              - URL 示例：/order?trainNumber=G1234&from=北京南&to=上海虹桥&departureTime=08:00&arrivalTime=12:30&date=2025-01-20&duration=4小时30分&seatType=二等座&price=553
            - 若URL参数缺失：
              - 使用默认值填充（如车次号"G1234"、默认站点"北京南"到"上海虹桥"等）

        2.1.2 改签入口
            - 从个人中心订单列表点击"改签"进入：
              - 使用location.state传入：
                - isChangeMode=true
                - changeOrder：包含原订单的车次信息、乘车人信息等
            - 在改签模式下：
              - isChangeMode为true，部分行为有所不同（如提交订单时弹出改签确认弹窗）

    2.2 顶部布局

        2.2.1 品牌与导航
            - 顶部Header与首页结构一致，包含：
              - 左侧品牌Logo与"中国铁路12306"文字
              - 中间搜索框
              - 右侧无障碍、敬老版、English、我的12306、登录/注册或欢迎+退出
            - 下方使用Navbar组件，当前激活项为"tickets"

        2.2.2 页面容器与背景样式
            - 样式定义：`frontend/src/pages/OrderPage.css` 中 `.order-page` 与 `.order-container`（frontend/src/pages/OrderPage.css:2-15）
            - 页面背景：
              - 整体背景为纯白色（`#fff`），最小高度 `min-height: 100vh`，上下留白 `padding: 20px 0`
            - 主体容器：
              - 最大宽度 `max-width: 1200px`，水平居中 `margin: 12px auto 0`
              - 背景为白色，圆角 `12px`，整体无投影（`box-shadow: none`），内容超出部分隐藏（`overflow: hidden`）
            - 订单头部区域：
              - 头部背景为从 `#4a90e2` 渐变到 `#357abd` 的线性渐变（135°），字体颜色为白色
              - 内边距 `25px 30px`，左右采用 `flex` 布局，`justify-content: space-between`，`align-items: center`
              - 标题字号为 `24px`，字重 `600`，带轻微文字阴影增强可读性

    2.3 列车与席别信息

        2.3.1 列车摘要信息
            - 展示内容：
              - 车次号（trainInfo.trainNumber）
              - 出发站与到达站（from/to）
              - 出发时间与到达时间
              - 发车日期（包含周几，如"2025-01-20（周一）"）
              - 历时信息（duration）

        2.3.2 席别价格与余票（seatInfo）
            - 页面加载时调用getTrainDetail接口获取seatInfo
            - 对于每个席别（如"商务座"、"一等座"、"二等座"等），展示：
              - 实时价格（若后端提供）
              - 实时余票：
                - availableSeats<=0 => "无票"
                - availableSeats>10 => "有票"
                - 1~10 => 显示"{availableSeats}张票"
            - 若seatInfo中不存在某席别：
              - 默认视为"无票"，不可选

        2.3.3 折扣显示
            - 基于seatInfo中的价格与基准价的比值计算折扣
            - 折扣=当前价/基准价×10
            - 折扣在1~10之间取一位小数
            - 当折扣≥10时不显示折扣文字；否则显示"{折扣}折"

        2.3.4 列车信息区域UI细节
            - 样式定义：`frontend/src/pages/OrderPage.css` 中 `.train-info-section` 与 `.train-summary*`（frontend/src/pages/OrderPage.css:62-120）
            - 布局尺寸：
              - 列车信息区域宽度固定为 `980px`，居中展示（`margin: 0 auto`）
              - 背景为从纯白到浅灰的渐变（`#ffffff → #f8f9fa`），底部有 `1px` 灰色分隔线
            - 列车概要卡片：
              - 外层卡片 `border: 1px solid #e6f0fc`，圆角 `8px`，宽度 `980px`
              - 标题栏 `.train-summary-header` 背景为 `#3399FF`，高度约 `32px`，字体 `12px`，文字为白色
            - 车次与日期行：
              - 内容区 `.train-summary-body` 使用浅蓝背景 `#f0f7ff`，高度固定为 `98px`
              - 车次号、日期、出发时间等关键字段使用加粗黑色字体（`font-weight: 700; color: #000`）
            - 席别滚动区域：
              - `.train-summary-seats` 使用 `display: flex` 横向布局，`gap: 12px`，开启 `overflow-x: auto`
              - 多个席别标签在单行内横向排布，支持横向滚动查看所有席别

    2.4 乘车人管理

        2.4.1 初次加载乘车人
            - 调用getPassengers接口获取后端乘车人列表
            - 若接口失败且用户已登录：
              - 前端自动注入"本人"为默认乘车人，使用用户真实姓名、证件号、手机号等信息
        
        2.4.2 注入"本人"逻辑
            - 若后端返回的乘车人列表中不存在与当前登录用户身份信息匹配的记录：
              - 在列表首位插入一个标记为isDefault=true的乘车人：
                - name为user.realName
                - idCard为user.idNumber
                - phone为user.phoneNumber
                - passengerType固定为"成人"
        
        2.4.3 改签模式下乘车人自动勾选
            - 在isChangeMode为true且changeOrder包含乘客信息时：
              - 从changeOrder.passengers或changeOrder.passenger字段中提取乘客姓名
              - 在当前乘车人列表中匹配同名乘客并自动勾选
              - 为勾选的乘客自动生成对应的ticketInfos，使用当前车次seatType与价格
        
        2.4.4 普通模式下默认勾选
            - 若非改签模式且乘车人列表非空：
              - 默认勾选第一位乘车人
              - 为其生成一条ticketInfo记录（成人票，使用默认seatType与价格）
        
        2.4.5 勾选/取消乘车人（handlePassengerSelect）
            - 用户点击乘车人项：
              - 若该乘客尚未勾选：
                - 将其id加入selectedPassengers
                - 同时添加一条对应ticketInfo记录（票种根据passengerType推导）
              - 若该乘客已勾选：
                - 将其从selectedPassengers中移除
                - 从ticketInfos中移除相关记录
        
        2.4.6 刷新乘车人列表（refreshPassengers）
            - 在以下场景调用：
              - 用户添加乘车人成功后
              - 页面重新获得焦点或从后台回到前台时
            - 行为：
              - 重新调用getPassengers，应用同样的"本人"注入逻辑
              - 移除已被删除乘车人对应的勾选状态与ticketInfos
        
        2.4.7 添加乘车人（handleAddPassenger）
            - 通过AddPassengerModal收集乘车人信息并调用addPassenger接口
            - 添加成功后调用refreshPassengers刷新列表

        2.4.8 乘车人表格布局与样式
            - 样式定义：`frontend/src/pages/OrderPage.css` 中 `.passenger-table*` 相关规则（frontend/src/pages/OrderPage.css:988-1032）
            - 表格容器：
              - 外层使用灰色边框 `1px solid #e5e5e5`，圆角 `6px`，顶部与其它模块之间预留 `8px` 间距
              - 表头与表体共用一致的 `display: grid` 布局，避免列宽错位
            - 列宽与网格：
              - 默认列宽定义为 `grid-template-columns: 80px 140px 180px 160px 180px 1fr`
              - 改签模式下增加选择列，网格改为 `50px 140px 180px 160px 180px 1fr 80px`
              - 通过 `justify-self: start` 确保所有单元格内容左对齐
            - 表头与行高：
              - 表头高度约 `40px`，背景为浅灰 `#f8f8f8`，字体 `13px`
              - 数据行高度约 `38.5px`，行间以 `1px` 浅灰边线分隔，字体 `14px`
            - 关键字段样式：
              - 乘车人姓名列加粗（`font-weight: 600; color: #333`）
              - 证件号列使用深色文字，保证可读性
              - 票价列右对齐，字体 `16px`、颜色为醒目的票价红 `#ff4d4f`
            - 下拉选择控件：
              - 席别选择下拉框宽度占满单元格，高度 `40px`
              - 使用方形边框、浅灰描边，获得焦点时描边变为主题蓝色 `#4a90e2`，并带有柔和外发光

    2.5 票种与席别选择

        2.5.1 票种（成人票/儿童票/学生票）
            - 对每个乘客的ticketInfo，允许用户选择ticketType：
              - 成人票
              - 儿童票
              - 学生票
            - 切换票种不改变当前价格逻辑（价格仍基于seatType与seatInfo）

        2.5.2 席别选择与价格联动（handleSeatTypeChange）
            - 用户可为每位乘客选择席别
            - 每当seatType变更：
              - 使用getSeatPrice和seatInfo重新计算该乘客票价

        2.5.3 提交前席别校正（handleConfirmOrder）
            - 在提交订单前，系统会：
              - 计算当前列车可用席别列表（getAvailableSeatTypes）
              - 对每条ticketInfo：
                - 若所选seatType不在可用列表中，则回退到第一个可用席别
                - 根据seatInfo中该席别的价格或基准价重新计算票价

    2.6 提交订单与后端交互

        2.6.1 提交前校验（handleSubmitOrder）
            - 若没有任何乘客被勾选：
              - 若乘车人列表非空则自动勾选第一位乘客并生成ticketInfo
              - 若列表为空但用户已登录，则创建一个临时"自助下单"乘客并勾选
              - 否则提示"请选择乘车人"
            - 检查所有ticketInfos是否包含seatType与passengerName
              - 若存在不完整记录则提示"请完善所有乘车人的购票信息"
            - 非改签模式：
              - 打开OrderConfirmModal确认弹窗
            - 改签模式：
              - 打开ChangeTicketConfirmModal改签确认弹窗

        2.6.2 构建OrderData（handleConfirmOrder）
            - 根据selectedPassengers过滤出有效乘车人列表
            - 使用校正后的ticketInfos构建OrderData：
              - orderId：前端生成的临时订单号（ORDER_时间戳_随机串）
              - totalPrice：所有票价之和
              - passengers：选中乘客数组
              - ticketInfos：每位乘客对应席别与票价信息
              - selectedSeatCodes：用户在确认弹窗中可能选择的席位编码列表
              - assignedSeats：初始为空数组，等待后端返回真实席位
            - 保存OrderData到状态并打开OrderProcessing步骤页

        2.6.3 调用后端创建订单（handleProcessingComplete）
            - 用户在OrderProcessing组件中点击“完成”后：
              - 构造orderPayload：
                - trainInfo：车次号、站点、时刻、日期与历时
                - passengers：选中乘客信息
                - ticketInfos：票种与席别信息
                - totalPrice：总价
                - selectedSeats：用户选中席位编码
              - 调用createOrder接口
            - 接口返回：
              - response.data.id：后端订单主键ID
              - response.data.orderId：可展示给用户的订单号
              - response.data.order.passengers：包含seatNumber等信息的乘客列表

        2.6.4 后端席位映射与本地存储
            - 前端解析response.data.order.passengers中的seatNumber（格式如"1车1A"）：
              - 拆分出车厢与座位号
              - 通过身份证号与本地OrderData中的乘客匹配
              - 生成assignedSeats数组，并更新OrderData.backendOrderId与assignedSeats
            - 同时将座位分配结果写入localStorage：
              - key："orderSeatAssignments:{后端ID}"与"orderSeatAssignments:{orderId}"
              - value：{ orderNumber, passengers: [{ name, seatNumber, carriage, seatType }] }

        2.6.5 跳转到支付页
            - 订单创建成功后：
              - 使用navigate跳转到"/pay-order?orderId={后端ID}"
              - 通过location.state传递订单摘要（trainInfo、passengers、ticketInfos、totalPrice、assignedSeats等）

    2.7 改签流程（handleConfirmChange）

        2.7.1 改签请求构造
            - 必须存在changeOrderData.id作为原订单编号
            - 构造payload：
              - oldOrderId：原订单ID
              - newTrainInfo：新车次信息（车次号、站点、时刻、日期、历时）
              - passengers：基于ticketInfos与当前乘车人列表重组的乘客数组
              - totalPrice：新订单总价
              - selectedSeats：用户选择的新席位编码

        2.7.2 改签结果处理
            - 调用changeOrder接口
            - 若返回中无newOrderId：
              - 视为改签成功但不进入支付流程
              - 提示"改签成功！"并跳转到个人中心页面"/profile"
            - 若存在newOrderId：
              - 使用navigate跳转到"/pay-order?orderId={newOrderId}"
              - 通过location.state传入新订单相关信息，并标记isChangeMode=true

    3. 支付页与支付弹窗

    3.1 支付页（/pay-order）

        3.1.1 页面内容概述
            - 顶部品牌与导航与其它页面保持一致
            - 主体展示：
              - 订单号
              - 车次与站点信息
              - 乘车人与席位信息
              - 支付金额与预计到期时间
            - 提供"立即支付"按钮，点击时打开PaymentModal

        3.1.2 页面整体布局与样式
            - 样式定义：`frontend/src/pages/OrderPage.css` 中 “支付订单页样式” 段（frontend/src/pages/OrderPage.css:1133-1208）
            - 页面背景与容器：
              - `body` 区域使用纯白背景，`PayOrderPage` 根节点类名为 `.pay-order-page`
              - 主体容器 `.pay-container`：
                - 最大宽度 `980px`，宽度占满父级 `width: 100%`
                - 水平居中 `margin: 16px auto`，左右内边距 `12px`
            - 顶部提示横幅 `.pay-banner`：
              - 背景为白色，边框 `1px solid #3399FF`，高度至少 `80px`
              - 左侧圆形图标 `.banner-icon` 宽高 `28px`，浅蓝背景 `#e6f7ff`，中间显示锁形符号
              - 右侧文案支持内联高亮倒计时：
                - 倒计时文本 `.countdown` 使用橙色 `#ff8c00`、加粗显示
                - 分钟与秒数 `.count-mm`、`.count-ss` 字号为 `18px`

        3.1.3 订单信息卡片与乘客表格
            - 订单信息卡片 `.pay-card`：
              - 顶部与横幅间距 `12px`，边框 `1px solid #3399FF`，直角边框（`border-radius: 0`）
              - 标题栏 `.pay-card-header` 使用与订单页头部一致的蓝色渐变背景，白色文字，字体 `14px`
              - 标题栏高度不超过 `32px`，内边距 `6px 12px`
            - 车次与站点信息：
              - 使用 `.pay-info-row` 水平排布日期、车次号和站点
              - 车次号采用加粗深色显示（`color: #040405`），出发/到达站名使用 `.station-strong` 加粗
              - 站名后的“站”字使用较小字号 `10px`，颜色 `#666`，模拟 12306 原站点缩略样式
            - 乘客列表表格 `.pay-passenger-table`：
              - 外层边框为浅蓝 `#e6f0fc`，圆角 `6px`
              - 表头与行均采用 `grid` 布局：
                - 默认列宽：`60px 60px 100px 1fr 100px 100px 80px 100px 120px`
              - 表头高度 `28.5px`，浅灰背景 `#f8f8f8`，字体 `13px`
              - 数据行高度约 `33px`，行间通过浅灰分割线区分
            - 金额与按钮区域：
              - 底部 `.pay-card-footer` 通过 `.pay-total-row` 右对齐展示总金额，金额颜色为橙色 `#de8920`
              - 操作区 `.pay-action-row` 居中排布“取消支付”和“立即支付”按钮
              - `立即支付` 按钮 `.pay-btn` 使用亮橙色背景 `#fa8c16`，悬停时变为更深橙色 `#f57c00`

    3.2 支付弹窗（PaymentModal）

        3.2.1 展示内容
            - 弹窗标题："订单支付"
            - 支付方式区域：
              - 当前实现以支付宝扫码支付为主：
                - 左侧图标：`/alipay-logo.png`
                - 文案："支付宝扫码支付"
            - 中部展示二维码与提示：
              - 扫码二维码（通过外部接口生成）或“正在生成二维码...”提示占位
              - 下方提示文案："请使用支付宝扫描二维码完成支付"
            - 底部展示支付剩余时间（分:秒），以及支付处理中 / 成功 / 失败态

        3.2.2 行为
            - 用户点击"确认支付"模拟完成支付：
              - 调用onSuccess回调（由OrderPage传入）
              - OrderPage中onSuccess逻辑：
                - 若OrderData.backendOrderId存在：
                  - 调用updateOrderStatus接口将订单状态更新为"paid"，支付方式为"alipay"
                - 关闭PaymentModal
                - 弹出"支付成功"提示，并显示订单号与金额
                - 跳转回首页"/"，以满足集成测试期望
            - 用户关闭弹窗或点击"取消"：
              - 调用onClose回调
              - 提示"支付已取消，您可以在订单中心继续支付"
              - 跳转到首页"/"

        3.2.3 弹窗布局与视觉样式
            - 组件结构定义：`frontend/src/components/PaymentModal.tsx`（frontend/src/components/PaymentModal.tsx:86-168）
            - 遮罩层：
              - 使用 `.payment-modal-overlay` 全屏固定定位，背景为半透明黑色 `rgba(0,0,0,0.6)`
              - 通过 `display: flex; justify-content: center; align-items: center; z-index: 1000` 将弹窗居中
            - 弹窗主体 `.payment-modal`：
              - 背景为白色，圆角 `8px`，宽度占屏幕 `90%`，但最大宽度限制为 `600px`
              - 最大高度为视口高度的 90%（`max-height: 90vh`），内容超出时出现垂直滚动条
              - 盒阴影 `0 10px 30px rgba(0,0,0,0.3)`，突出层级
            - 头部区域 `.payment-header`：
              - 左侧标题 `h2` 字号 `18px`，字重 `600`，右侧为圆形关闭按钮
              - 关闭按钮为无边框圆形图标按钮（宽高 `30px`），悬停时改变背景色以强化可点击性
            - 内容区：
              - 上方订单概要 `.order-summary` 使用浅灰背景 `#f8f9fa` 与边框，内边距 `16px`，圆角 `6px`
              - 详细信息 `.order-details` 采用列方向 `flex` 布局，行间间距 `8px`
              - 应付金额行 `.detail-row.total-price` 在视觉上加粗，金额文字颜色为红色 `#e74c3c`，字号 `18px`
            - 支付区域 `.payment-area`：
              - 周围使用淡灰边框，内边距 `20px`，整体居中对齐
              - 二维码区域 `.qr-code` 固定尺寸 `200x200`，圆角 `6px`，带浅灰描边
            - 状态视图：
              - `paymentStatus === 'processing'` 时展示蓝色加载圆环及提示文案
              - `paymentStatus === 'success'` 时展示绿色圆形勾选图标及成功提示
              - `paymentStatus === 'failed'` 时展示红色圆形叉号图标、失败文案及“重新支付”按钮（蓝底白字）
            - 底部安全提示 `.payment-footer`：
              - 背景为浅灰 `#f8f9fa`，顶部有 `1px` 分隔线
              - 中央显示锁形图标及“支付环境安全，请放心支付”文案

    4. 订单详情与退票成功

    4.1 订单详情页（/order-detail/:orderId）

        4.1.1 内容概述
            - 顶部品牌与导航保持统一
            - 展示指定订单的详细信息：
              - 订单号、车次、站点、时间、座位信息、乘车人信息、订单状态等
            - 提供操作：
              - 去支付（未支付时）
              - 退票/改签（根据当前订单状态与出发时间）

        4.1.2 表格与按钮布局样式
            - 主要结构定义：`frontend/src/pages/OrderDetailPage.tsx`（frontend/src/pages/OrderDetailPage.tsx:273-322）
            - 订单信息头部：
              - 使用与支付页一致的 `.pay-card-header` 与 `.pay-info-row` 样式，保证视觉统一
              - 出发站使用较大红色字体显示（内联样式 `fontSize: 24, color: '#f42421ff'`），突出始发站
            - 乘客信息表：
              - 使用 `.pay-passenger-table` 与 `.detail-passenger-table` 组合样式
              - 表头与行采用 `grid` 布局：
                - 详细表增加“订单状态”列，网格定义为 `60px 60px 100px 1fr 100px 100px 80px 100px 120px 100px`
              - 订单状态列字体颜色为橙色 `#f47621`，固定显示“已支付”
            - 底部操作区：
              - 采用 `.pay-action-row` 样式，按钮从左到右为“餐饮•特产”、“继续购票”、“查看订单详情”
              - 继续购票按钮使用中性边框样式，查看订单详情按钮 `.pay-btn` 使用橙色背景，与支付页按钮保持一致
            - 温馨提示：
              - 使用 `.warm-tips` 与 `.warm-tips-list` 样式，标题加粗，列表项行高 `1.7`，字号偏小，颜色 `#666`

        4.2 退票成功页（/refund-success）

        4.2.1 展示内容
            - 顶部品牌与导航
            - 中间区域：
              - Logo 图片："/铁路12306-512x512.png"
              - 提示文字："操作成功！"（页面标题）以及“业务流水号”等信息
              - 退票订单相关摘要信息（乘车日期、车次、共计退款、票款原价、退票手续费等）
            - 底部提供返回个人中心或首页的链接

        4.2.2 页面布局与配色细节
            - 页面结构与样式：`frontend/src/pages/RefundSuccessPage.tsx` 与 `frontend/src/pages/RefundSuccessPage.css`（frontend/src/pages/RefundSuccessPage.css:1-80）
            - 页面背景与容器：
              - 根容器 `.refund-success-page` 使用浅灰背景 `#f5f5f5`，最小高度 `100vh`
              - 内容区域 `.refund-success-container` 最大宽度 `980px`，居中展示，左右留白 `10px`
            - 成功信息区域 `.success-section`：
              - 使用浅绿色背景 `#EEF7EA`，边框颜色为 `#CDE6C7`，底部边框为虚线 `#AACCA0`
              - 内边距 `40px 40px 30px`，顶部圆角 `4px`
            - 关键提示元素：
              - 左侧大号勾选图标 `.success-icon-large` 为绿色渐变圆形，宽高 `42px`
              - “业务流水号”与金额采用橙色字体 `#FF9900`，加粗显示
              - 详细行文本字号 `14px`，颜色 `#666`，通过 `padding-left: 70px` 与勾选图标对齐
            - 操作按钮：
              - “继续购票”按钮 `.btn-continue` 使用浅灰背景、灰色文字
              - “查询订单详情”按钮 `.btn-details` 使用橙色背景 `#FF9900` 与白色文字，悬停时变为更深橙色
            - 底部说明区域 `.notes-section`：
              - 使用淡黄色背景 `#FFFBE6`，与上方绿色成功区域通过边框无缝衔接
              - 列表项字体为 `12px`，行距较大，方便阅读说明文字

5. 场景示例

    5.1 用户完成一次完整购票并支付
        Scenario: 用户从车次列表进入订单页并完成支付
            Given 用户在"/train-list"页面选择了一趟有票的车次
            And 系统跳转到"/order"页面并展示该车次的基本信息
            And 用户在乘车人区域勾选至少一位乘车人
            And 用户为每位乘车人选择了席别与票种
            When 用户点击"提交订单"按钮
            Then 系统弹出订单确认弹窗，展示乘车人、车次与总价信息
            When 用户在确认弹窗中确认提交
            Then 系统展示订单处理中页面并向后端发送创建订单请求
            And 后端返回订单ID与座位信息
            And 系统将座位分配结果写入本地存储并跳转到"/pay-order"页面
            When 用户在支付页面点击"立即支付"并在支付弹窗中确认支付
            Then 系统调用接口更新订单状态为已支付
            And 弹出"支付成功"提示并包含订单号与总金额
            And 页面自动跳转回首页"/"

