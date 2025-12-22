1. 个人中心与常用信息管理

    1.1 个人中心页面（/profile）

        1.1.1 页面结构
            - 顶部Header与Navbar与首页保持一致
            - 页面主体采用左右结构：
              - 左侧为功能导航菜单（如"我的订单"、"常用乘车人"、"常用地址"等）
              - 右侧为当前功能对应内容区域

        1.1.2 我的订单列表
            - 展示当前用户全部订单列表，包含：
              - 订单号
              - 车次号与区间
              - 出发时间与到达时间
              - 订单金额
              - 订单状态（待支付、已支付、已取消、已退票等）
            - 针对不同状态提供对应操作按钮：
              - 待支付：
                - "去支付"：跳转到"/pay-order"并携带订单信息
                - "取消订单"：调用后端接口将状态变更为已取消
              - 已支付且未发车：
                - "退票"：进入退票流程，成功后跳转到"/refund-success"
                - "改签"：携带当前订单信息跳转到"/train-list"，进入改签查询模式
              - 已退票或已取消：
                - 展示状态标签，不提供进一步操作

        1.1.3 常用乘车人管理
            - 展示当前用户的乘车人列表：
              - 包含姓名、证件类型与号码、手机号、乘客类型等信息
              - 列表中可能包含自动注入的"本人"记录（与订单页保持一致）
            - 支持操作：
              - "新增乘车人"：
                - 打开AddPassengerModal弹窗
                - 填写姓名、证件类型/号码、手机号、乘客类型等字段
                - 点击保存后调用后端接口持久化
              - "编辑"：
                - 允许修改乘车人信息并保存到后端
              - "删除"：
                - 调用后端接口删除对应记录
            - 乘车人信息与订单页共享同一数据源：
              - 订单页通过getPassengers接口与Profile页保持一致

        1.1.4 常用地址管理
            - 展示当前用户的收货地址列表（用于餐饮与其它服务）
            - 列表字段包含：
              - 收件人姓名
              - 联系电话
              - 省市区及详细地址
              - 是否默认地址标记
            - 支持操作：
              - 新增地址：通过弹窗或表单填写地址并保存
              - 编辑地址：修改现有地址信息
              - 删除地址：从列表中移除并同步到后端

        1.1.5 品牌信息与页脚
            - 页面底部展示品牌Logo：
              - 图片："/铁路12306-512x512.png"
            - 同时展示统一版权信息，与首页和订单页保持一致

        1.1.6 个人中心页面布局与样式细节
            - 布局与容器：
              - 样式定义：`frontend/src/pages/ProfilePage.css` 中 `.profile-main` 段（frontend/src/pages/ProfilePage.css:64-74）
              - 页面主体使用双列网格布局：左侧为宽度180px的功能导航栏，右侧为自适应宽度的内容区域
              - 主体最大宽度为1200px，水平居中（`margin: 0 auto`），上下内边距约20px，整体背景为纯白
              - 主体区域最小高度为 `calc(100vh - 120px)`，保证在内容较少时也能撑满可视高度
            - 左侧用户信息与导航：
              - 侧边栏容器 `.profile-sidebar`：
                - 固定宽度180px，背景为白色，圆角8px，无阴影，高度自适应内容（`height: fit-content`）
              - 用户信息卡 `.user-info-card`：
                - 内边距20px，底部使用1px浅灰分隔线，将头像与导航区域分隔
                - 内部使用水平flex布局，头像与文字间距约15px
              - 头像 `.avatar`：
                - 直径60px的圆形容器，使用12306主题红色渐变背景（从 `#E2422B` 过渡到 `#d63918`）
                - 中间居中显示用户首字母或图标，字体大小24px、加粗、白色
              - 用户名与附属信息 `.user-details`：
                - 用户名字体18px，深灰色 `#333`，下方一行小号灰色文案（14px，`#666`）用于展示会员等级或提示
            - 侧边导航树：
              - 样式定义：`frontend/src/pages/ProfilePage.css` 中 `.sidebar-nav` 与 `.nav-group*` 段（frontend/src/pages/ProfilePage.css:118-231）
              - 每个导航分组 `.nav-group` 之间使用1px浅灰分隔线，上方为加粗分组标题 `h4`
              - 可折叠分组（如订单中心、个人信息）标题右侧带有小型折叠按钮 `.tree-toggle`，按钮宽度不超过7px，高度约20px
              - 子项列表 `.tree-list` 使用左侧竖线（`border-left: 1px solid #e5e5e5`）连接，子按钮左内边距22px，模拟树形结构
              - 当前激活菜单项 `.nav-group button.active` 使用纯蓝背景 `#3399FF` 与白色文字，其他项为黑色粗体文字，hover时文字变蓝
            - 右侧内容区域：
              - 内容容器 `.profile-content` 背景为白色，圆角8px，带轻微阴影（`0 2px 8px rgba(0,0,0,0.1)`），内部通过 `.content-section` 分块
              - 每个分块内部使用统一的标题栏与面包屑样式，保持与订单详情页等页面一致的视觉语言

        1.1.7 我的订单列表布局与样式细节
            - 样式定义：`frontend/src/pages/ProfilePage.css` 中 “订单管理” 段（frontend/src/pages/ProfilePage.css:886-947, 949-983）
            - 页签与筛选条：
              - 顶部订单状态页签 `.order-tabs`：
                - 使用横向flex布局，包裹三个页签按钮 `.tab-btn`
                - 容器带1px浅灰描边 `#d9d9d9`，无圆角，整体高度至少40px
              - 页签按钮 `.tab-btn`：
                - 每个页签等宽伸展（`flex: 1`），内部水平垂直居中文本
                - 按钮高度约40px，字体16px，默认文字颜色 `#333`
                - 当前激活页签 `.tab-btn.active` 背景为浅蓝 `#f0f7ff`，文字为高亮蓝 `#427aea`，并加粗
              - 高级筛选条 `.order-filters.advanced`：
                - 使用水平flex布局，包含日期模式选择、起止日期、车票关键字搜索等控件
                - 整体顶部留出8px外边距，左侧12px内边距，底部使用1px浅灰线分隔
                - 下拉框与日期输入 `.filter-select` / `.date-filter` 使用圆角4px、浅灰边框 `#ddd`，获得焦点时描边变为主题红 `#E2422B`，并出现浅红色外发光
            - 订单列表表头与数据区域：
              - 列表容器 `.orders-table` 使用单列grid布局，内部每一条订单为一块 `.orders-table-item`
              - 表头 `.orders-table-header`：
                - 使用 `grid-template-columns: 1fr 1fr 1fr 120px 120px` 五列布局，依次对应车次信息、旅客信息、席位信息、票价、车票状态
                - 高度约40px，浅灰背景 `#f8f8f8`，字体15px，整体有1px浅灰边框和直角
              - 每条订单的展开行 `.orders-table-row`：
                - 与表头列宽保持一致，内边距 `8px 12px`，字体14px
                - 车次路由 `.train-col .train-route` 使用16px加粗字体、深灰色 `#333`
                - 车次号 `.train-no` 使用高亮蓝 `#4a90e2` 并加粗
                - 旅客姓名 `.passenger-name` 使用14px加粗字体，证件类型 `.id-type` 使用12px灰色字体
            - 订单元信息与操作区：
              - 订单元信息条 `.order-meta`：
                - 背景为浅蓝 `#e6f4ff`，高度约40px，左侧展示“订票日期”和“订单号”等元信息
                - 左端有折叠开关按钮 `.toggle-btn`，为20x20px方形边框按钮，显示“▾/▸”
              - 票价与状态：
                - 票价单元 `.price-col .price-val` 颜色为橙色 `#de8920`
                - 车票状态通过 `.ticket-status.*` 不同类名区分颜色：
                  - `paid` 为绿色 `#2f8f3b`
                  - `unpaid` 为橙色 `#fa8c16`
                  - `completed` 为蓝色 `#1677ff`
                  - `changed/refunded` 为灰色 `#999`
              - 操作按钮区 `.order-ops`：
                - 使用flex右对齐排布多个操作按钮（详情、改签、餐饮•特产等）
                - 一般按钮 `.ops-btn` 为白底、浅灰边框圆角4px，hover时背景变为浅灰
                - 主要操作按钮 `.detail-btn` 使用橙色背景 `#fa8c16` 与白色文字，hover时变为更亮的橙色 `#ff9f40`

        1.1.8 常用乘车人管理布局与样式细节
            - 样式定义：`frontend/src/pages/ProfilePage.css` 中 “乘车人管理” 段（frontend/src/pages/ProfilePage.css:496-548, 550-612, 642-667, 675-719）
            - 工具栏与搜索区域：
              - 顶部工具栏 `.passenger-tools`：
                - 水平布局，包含搜索输入、搜索按钮及批量操作入口
                - 左右保留12px外边距，底部与表格之间留出12px间距
              - 搜索输入容器 `.search-input-wrap`：
                - 固定宽度260px，内部绝对定位清除按钮 `.clear-btn`
                - 输入框 `.search-input` 使用圆角4px、浅灰边框 `#d9d9d9`，左右内边距分别为12px与28px
                - 清除按钮为直径20px的圆形按钮，位于输入框右侧居中位置
              - 搜索按钮 `.search-btn`：
                - 使用蓝色描边 `#1890ff` 与白底，hover时描边与文字颜色变为橙色 `#fa8c16`
            - 乘车人表格容器：
              - 表格外层 `.passenger-table`：
                - 左右各有12px外边距，背景为白色，使用1px浅灰边框与8px圆角
              - 表头与行 `.table-header` / `.table-row`：
                - 通过grid布局对齐各列，默认列定义在 `.passenger-table .table-header/.table-row`
                - 网格列宽为 `44px 60px 128px 140px 200px 160px 128px 128px`，依次对应勾选框、序号、姓名、证件类型、证件号码、手机号、校验状态、操作列
                - 表头背景为浅灰 `#fafafa`，底部边框 `1px solid #f0f0f0`，字体约13px
                - 数据行高度约40px，顶部通过1px浅灰边线与上一行分隔
              - 列内容样式：
                - 勾选列 `.col-check` 文本居中，用于展示多选框
                - 序号列 `.col-index` 使用浅灰色文字 `#999`
                - 姓名列 `.col-name` 加粗显示，颜色 `#333`
                - 证件号、手机号等列使用常规深灰色 `#333`
                - 操作列 `.col-actions` 使用水平flex布局，内部按钮间距约6px
            - 操作按钮与状态标记：
              - 新增乘车人按钮 `.add-action`：
                - 位于工具栏或管理条中，使用文本按钮样式，前方通过 `.passenger-table .add-action::before` 伪元素绘制绿色圆形加号图标
                - 加号图标直径20px，背景为绿色 `#52c41a`，白色“+”符号，带轻微内阴影
              - 批量删除按钮 `.bulk-delete-action`：
                - 左侧带有红色垃圾桶图标（通过 `::before` 伪元素实现），图标尺寸约20x20px，颜色 `#E2422B`
              - 单个乘车人操作按钮 `.op-btn.edit/.op-btn.delete`：
                - 均为小号矩形边框按钮，圆角4px
                - 编辑按钮使用蓝色描边 `#bae7ff` 与蓝色文字 `#1890ff`
                - 删除按钮使用浅红描边 `#ffccc7` 与红色文字 `#ff4d4f`
              - 证件校验状态 `.verify-badge`：
                - 由圆形小点 `.dot` 与文字组成，绿色小点 `ok` 表示通过，橙色小点 `warn` 表示存在提示

        1.1.9 常用地址管理布局与样式细节
            - 样式定义：`frontend/src/pages/ProfilePage.css` 中 地址管理相关样式（frontend/src/pages/ProfilePage.css:649-673, 675-692, 1060-1137）
            - 地址表格：
              - 表格外层 `.address-section` 使用20px内边距，内部 `.address-table` 背景为白色、直角边框，无圆角（`border-radius: 0`）
              - 表头与行同样使用grid布局，但列宽定义为 `60px 120px 1fr 140px 100px 100px`：
                - 依次对应序号、收件人姓名、详细地址、联系电话、是否默认、操作
              - 表头背景为浅灰 `#fafafa`，行间使用1px浅灰线分隔
            - 地址管理条与提示：
              - 顶部管理条 `.manage-bar` 背景为浅蓝 `#e6f7ff`，上下使用浅蓝描边 `#bae7ff`，内部水平排列“新增地址”等操作
              - 新增地址按钮在HTML中自带加号图标 `<span class="add-icon">+</span>`，通过 `.manage-bar .add-action .add-icon` 样式绘制圆形绿色背景，与乘车人新增按钮视觉一致
              - 下方提示区域 `.address-tips` 使用浅橙背景 `#fff7e6` 与橙色描边 `#ffd6b3`，内部通过有序列表展示地址填写注意事项，字体13px
            - 地址表单区域：
              - 表单容器 `.address-form-panel` 背景透明，无额外边框，顶部与底部留有20px内边距
              - 表单标题 `.form-header h3` 字体16px、加粗，靠左对齐，不再重复边框
              - 每行键值项 `.kv-item` 使用竖直方向间距8px，不再显示底部分隔线
              - 标签 `.kv-label` 宽度100px，右对齐，右侧保留15px间距
              - 必填项红色星号 `.red-star` 使用 `#E2422B` 颜色，紧挨字段标签显示

2. 餐饮服务模块

    2.1 餐饮服务首页（/catering）

        2.1.1 布局与背景
            - 顶部Header与Navbar与首页保持一致
            - 页面背景顶部区域使用大图：
              - CSS 背景图："/homepage/Carousel/Carousel_5.jpg"
            - 中部显示餐饮服务入口卡片，如：
              - "订餐服务"
              - "车站餐饮"
              - "列车餐饮"

        2.1.2 入口链接
            - "订餐服务"入口点击后跳转至"/catering/book"
            - 其他入口可作为未来扩展，目前多为静态展示

        2.1.3 品牌信息
            - 顶部区域显示12306品牌Logo：
              - 图片："/铁路12306-512x512.png"

    2.2 订餐预订页面（/catering/book）

        2.2.1 页面布局
            - 顶部Header与Navbar保持一致
            - 页面主体水平分为三块：
              - 左侧为列车选择与下单进度
              - 中间为可选餐品列表
              - 右侧为品牌商家与订单摘要

        2.2.2 自营冷链餐商品
            - 固定展示3个自营冷链餐：
              - "15元冷链餐"，图片："/Food/列车自营商品-15元.jpg"
              - "30元冷链餐"，图片："/Food/列车自营商品-30元.jpg"
              - "40元冷链餐"，图片："/Food/列车自营商品-40元.jpg"
            - 用户可以选择数量，将其加入当前订餐购物车

        2.2.3 品牌餐饮商列表
            - 品牌列表数据源：
              - 品牌"永和大王"，图片："/Food/永和大王.jpg"
              - 品牌"老娘舅"，图片："/Food/老娘舅.jpg"
              - 品牌"麦当劳"，图片："/Food/麦当劳.jpg"
              - 品牌"康师傅"，图片："/Food/康师傅.jpg"
              - 品牌"德克士"，图片："/Food/德克士.jpg"
              - 品牌"真功夫"，图片："/Food/真功夫.jpg"
            - 每个品牌显示Logo和营业状态（如"营业中"、"休息中"）
            - 点击某品牌可跳转到品牌详情页"/catering/vendor"，并通过路由state传递当前品牌信息

        2.2.4 商品与品牌缩略图兜底图
            - 商品图片缺失时使用"/image.png"作为兜底图
            - 品牌Logo缺失时使用"/logo-12306.svg"作为兜底图

        2.2.5 订餐流程概述
            - 用户选择列车与送餐站点
            - 在中间区域勾选各类餐品及数量
            - 右侧实时展示所选商品总价
            - 点击"提交订单"后，可进入订单确认流程（与车票订单逻辑类似或调用后端对应餐饮订单接口）

    2.3 品牌详情页面（/catering/vendor）

        2.3.1 页面布局
            - 顶部展示品牌Logo与店铺名称：
              - 品牌Logo图片："/Food/{品牌名}.jpg"
            - 中间区域展示该品牌提供的商品列表
            - 底部展示品牌与12306合作的说明信息

        2.3.2 商品列表数据源
            - 按品牌预置多组商品：
              - 永和大王：
                - "特惠地瓜丸"："/Food/永和大王/特惠地瓜丸.jpg"
                - "蜂蜜柚子饮"："/Food/永和大王/蜂蜜柚子饮.jpg"
                - "咖喱牛腩饭柚子饮套餐"："/Food/永和大王/咖喱牛腩饭柚子饮套餐.jpg"
                - "双人超值套餐A"："/Food/永和大王/双人超值套餐A.jpg"
              - 德克士：
                - "左宗棠鸡味炸鸡饭套餐"："/Food/德克士/左宗棠鸡味炸鸡饭套餐.jpg"
                - "经典脆爽双鸡堡套餐"："/Food/德克士/经典脆爽双鸡堡套餐.jpg"
                - "经典脆爽双鸡堡"："/Food/德克士/经典脆爽双鸡煲.jpg"
                - "脆皮鸡腿堡套餐（柠香）"："/Food/德克士/脆皮鸡腿堡套餐（柠香）.jpg"
              - 真功夫：
                - "阳光番茄牛腩饭+元气乌鸡汤+田园彩豆"："/Food/真功夫/阳光番茄牛腩饭+元气乌鸡汤+田园彩豆.jpg"
                - "鲜辣排骨饭+香滑蒸蛋+田园彩豆"："/Food/真功夫/鲜辣排骨饭+香滑蒸蛋+田园彩豆.jpg"
                - "香汁排骨饭+乌鸡汤+田园彩豆"："/Food/真功夫/香汁排骨饭+乌鸡汤+田园彩豆.jpg"
              - 康师傅：
                - "嫩煎厚切牛肉杂粮饭"："/Food/康师傅/嫩煎厚切牛肉杂粮饭.jpg"
                - "蒲烧鳗鱼杂粮饭"："/Food/康师傅/蒲烧鳗鱼杂粮饭.jpg"
                - "嫩煎厚切牛肉杂粮饭可乐两件套"："/Food/康师傅/嫩煎厚切牛肉杂粮饭可乐两件套.jpg"
                - "蒲烧鳗鱼杂粮饭可乐两件套"："/Food/康师傅/蒲烧鳗鱼杂粮饭可乐两件套.jpg"
              - 麦当劳：
                - "只爱甜的便民套餐乘运款"："/Food/麦当劳/只爱甜的便民套餐乘运款.jpg"
                - "麦麦脆汁鸡（鸡腿）1块"："/Food/麦当劳/麦麦脆汁鸡（鸡腿）1块.jpg"
                - "香芋派"："/Food/麦当劳/香芋派.jpg"
                - "鸡牛双堡双人餐乘运款"："/Food/麦当劳/鸡牛双堡双人餐乘运款.jpg"
              - 老娘舅：
                - "新台式卤肉饭"："/Food/老娘舅/新台式卤肉饭.jpg"
                - "绍兴梅干菜烧肉套餐"："/Food/老娘舅/绍兴梅干菜烧肉套餐.jpg"
                - "鱼香肉丝套餐"："/Food/老娘舅/鱼香肉丝套餐.jpg"

        2.3.3 商品操作
            - 每个商品卡片展示：
              - 商品图片
              - 商品名称
              - 商品价格
            - 用户可以点击"加入购物车"或类似按钮，将商品加入当前订餐订单（依据实际实现）

    2.4 餐饮模块页面布局与样式细节

        2.4.1 餐饮服务首页（/catering）视觉与搜索条
            - 样式定义：`frontend/src/pages/CateringPage.tsx` 与 `frontend/src/pages/CateringPage.css`（frontend/src/pages/CateringPage.css:1-32）
            - 顶部横幅：
              - 主体区域 `.catering-hero` 高度约380px，背景图使用 `Carousel_5.jpg`，覆盖整个区域并居中显示
              - 通过 `.hero-overlay` 添加半透明黑色遮罩（透明度约0.25），叠加文案与搜索条
              - 标题 `.hero-title` 字体28px、加粗，副标题 `.hero-subtitle` 字体24px，均为白色文字，居中排布
            - 搜索条 `.catering-search-bar`：
              - 采用grid布局，将日期、车次、乘车站、到达站、搜索按钮分为5列
              - 列宽定义为 `210px 210px 210px 210px 137px`，高度统一为56px
              - 整体背景为纯白，左右无额外内边距，每个输入框之间通过 `border-right: 1px solid #e5e5e5` 分隔
              - 输入框无边框与圆角，文字颜色 `#666`，占位符为更浅的灰色 `#999`
              - 搜索按钮 `.search-primary` 使用橙色背景 `#ff9f1a` 与白色文字，字体16px、加粗，hover时略微提亮

        2.4.2 订餐预订页面（/catering/book）过滤条与卡片布局
            - 样式定义：`frontend/src/pages/CateringBookingPage.tsx` 与 `frontend/src/pages/CateringBookingPage.css`（frontend/src/pages/CateringBookingPage.css:1-76, 78-121）
            - 页面容器：
              - 主体容器 `.booking-main` 宽度1190px，水平居中
              - 上方过滤区域 `.filter-row` 与 `.booking-filter`：
                - `.booking-filter` 宽度约1200px，高度约111.55px，背景为浅蓝 `#eef5ff`
                - 使用1px浅蓝边框 `#cfe1ff` 与8px圆角，内边距 `10px 12px`
            - 过滤条件区域：
              - 顶部 `.filter-top` 使用grid布局，列宽为 `248px 224px 236px 236px 104px`，依次对应乘车日期、车次、乘车站、到达站、查询按钮
              - 每个字段 `.field` 内通过 `.field-label` 与 `.filter-input` 左右排列，标签为14px灰色文字 `#666`
              - 输入框 `.filter-input` 高度30px，白底，浅蓝边框 `#e0e9ff`，无圆角
              - 查询按钮 `.btn-query` 高度30px，使用亮橙色背景 `#ff9f1a` 与白色文字，字体加粗
              - 顶部与底部通过虚线分隔线 `.filter-divider` 连接，颜色为蓝色 `#2a76ff`
            - 配送站与过滤条件：
              - 下方 `.filter-bottom` 使用两列grid布局：左侧为配送站单选/多选，右侧为“显示可预订商家”勾选框
              - 左侧“全部”按钮 `.chip-all`：
                - 尺寸约50x24px，背景为蓝灰色 `#8aa8d6`，白色文字，圆角4px
              - 车站勾选 `.station-check` 使用checkbox与站名横向排列，字体14px
            - 自营商品卡片：
              - 自营商品区 `.goods-section` 使用标题 `.section-title` 与分隔线 `.goods-divider` 组合强调
              - 商品列表 `.goods-grid` 使用 `grid-template-columns: repeat(3, 384px)` 三列布局，间距10px
              - 每个商品卡 `.good-card`：
                - 尺寸约384x140px，白底，1px浅灰边框 `#e9edf2`，6px圆角
                - 左侧商品图片 `.good-img` 固定宽度210px、高度140px，右侧文本区域右对齐
            - 品牌商家卡片：
              - 品牌列表 `.vendor-grid` 采用 `repeat(3, 385px)` 三列布局，间距10px
              - 商家卡片 `.vendor-card`：
                - 尺寸约385x130px，白底，1px浅灰边框，6px圆角，整体可点击（cursor: pointer）
                - 左侧品牌Logo `.vendor-thumb` 80x80px，右侧为商家名称与元信息
                - 右上角状态徽标 `.status-badge`：
                  - 当商家可预订时添加类 `.open`，背景为淡绿色 `#e6f5e6`，文字为深绿色 `#0a7f0a`
                  - 休息中 `.closed` 背景为浅灰 `#f7f7f7`，文字为灰色 `#999`

        2.4.3 品牌详情页面（/catering/vendor）布局与商品展示样式
            - 样式定义：`frontend/src/pages/CateringVendorPage.tsx` 与 `frontend/src/pages/CateringVendorPage.css`（frontend/src/pages/CateringVendorPage.css:1-32）
            - 页面结构与头部：
              - 根容器 `.vendor-page` 背景为白色，最小高度100vh，保证在内容较少时也能铺满屏幕
              - 主体容器 `.vendor-main` 宽度1190px，居中显示
              - 顶部面包屑 `.vendor-breadcrumb` 使用12px灰色文字，当前页面使用加粗样式，返回链接 `.crumb-link` 为12306蓝色 `#2a76ff`
              - 品牌头部 `.vendor-header`：
                - 使用左右分栏flex布局，背景为白色，1px浅蓝边框 `#cfe1ff`，6px圆角，内边距12px
                - 左侧展示品牌Logo `.vendor-avatar`（64x64px圆角8px）、店铺名称 `.vendor-title`（18px加粗）及评分/电话/营业时间信息
                - 右侧指标区域 `.vendor-header-right` 使用三列grid布局，分别展示起送费、配送费、下单/退单截止时间
            - 商品列表与标签：
              - 商品区域 `.vendor-products` 顶部为页签 `.vendor-tabs`，包含“所有商品”“评价”“商家”三种标签
              - 当前页签 `.tab.active` 文字为蓝色 `#2a76ff`，字体加粗；未激活页签为灰色文字
              - 下方 `category-bar` 使用浅灰背景 `#f5f6f8`，内部平铺各类商品分类标签 `.category-item`
              - 商品网格 `.products-grid` 使用 `grid-template-columns: repeat(4, 1fr)` 四列自适应布局，列间距12px
              - 单个商品卡 `.product-card`：
                - 白色背景，1px浅灰边框 `#e9edf2`，6px圆角，内边距10px
                - 商品图片高度180px、宽度自适应，圆角4px，下面依次为商品名称与价格
                - 价格 `.product-price` 使用亮橙色 `#ff9f1a` 并加粗，突出展示

3. 场景示例

    3.1 用户在个人中心改签并进入车次列表
        Scenario: 用户从个人中心选择订单发起改签
            Given 用户在"/profile"页面查看已支付订单列表
            And 某一订单尚未发车且支持改签
            When 用户点击该订单的"改签"按钮
            Then 系统携带当前订单的车次与乘客信息跳转到"/train-list"
            And 车次列表页的出发站与到达站被锁定为原订单站点
            And 页面顶部标记当前为"改签"模式

    3.2 用户在订餐页面选择品牌并查看详情
        Scenario: 用户在"/catering/book"页面浏览餐饮品牌
            Given 用户在订餐页面看到多个品牌Logo（永和大王、老娘舅、麦当劳等）
            When 用户点击"永和大王"品牌卡片
            Then 系统携带品牌信息跳转到"/catering/vendor"
            And 品牌详情页顶部显示"永和大王"Logo与店铺名称
            And 商品列表中展示多种永和大王套餐与饮品
