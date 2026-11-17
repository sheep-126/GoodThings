-- ==============================================
-- 季节风格穿搭测试与模拟选购系统 —— 数据库重建脚本
-- 执行方式：mysql -uroot -p --default-character-set=utf8mb4 Goodthing < Goodthing.sql
-- 目录：一、建库 | 二、表结构（11 张） | 三、视图（1 个） | 四、触发器（1 个）
--       五、存储过程（2 个） | 六、测试数据 | 七、收尾
-- ==============================================

-- ==============================================
-- 【一、建库】数据库、字符集与全局开关
-- ==============================================
CREATE DATABASE IF NOT EXISTS Goodthing DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Goodthing;

-- 索引规范：
--   1) InnoDB 会为每个外键自动建索引，本脚本只在需要复合查询时显式声明以该外键列开头的联合索引，
--      MySQL 检测到最左前缀后不再重复创建单列索引，从而避免同列冗余索引；
--   2) Cart 在 (UserID, ProductID) 上建唯一索引，与后端"先查后更新"的加购逻辑一致，防止并发写出重复行；
--   3) 主键与 UNIQUE 约束自带的索引不重复声明。

-- 重建脚本：先关闭外键检查，避免 DROP 顺序受外键约束影响
SET FOREIGN_KEY_CHECKS=0;

-- ==============================================
-- 【二、表结构 1/11】用户表 User
-- ==============================================
DROP TABLE IF EXISTS User;
CREATE TABLE User(
    UserID INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户编号主键',
    UserName VARCHAR(20) NOT NULL UNIQUE COMMENT '用户名',
    Password VARCHAR(32) NOT NULL COMMENT '加密密码',
    NickName VARCHAR(20) COMMENT '昵称',
    Gender VARCHAR(4) COMMENT '性别：男/女/保密，可为空',
    Phone VARCHAR(20) COMMENT '手机号',
    RegisterTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    IsAdmin TINYINT NOT NULL DEFAULT 0 COMMENT '是否管理员：0普通用户，1管理员'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- ==============================================
-- 【二、表结构 2/11】商品分类表 Category
-- ==============================================
DROP TABLE IF EXISTS Category;
CREATE TABLE Category(
    CategoryID INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类编号',
    CategoryName VARCHAR(20) NOT NULL UNIQUE COMMENT '分类名称'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品分类';

-- ==============================================
-- 【二、表结构 3/11】商品表 Product（StyleTag 存 春/夏/秋/冬）
-- ==============================================
DROP TABLE IF EXISTS Product;
CREATE TABLE Product(
    ProductID INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品编号',
    ProductName VARCHAR(50) NOT NULL COMMENT '商品名称',
    CategoryID INT COMMENT '分类外键',
    Price DECIMAL(10,2) COMMENT '商品价格',
    Stock INT NOT NULL DEFAULT 0 COMMENT '库存，不能负数',
    Image VARCHAR(100) DEFAULT NULL COMMENT '商品图片相对路径；为空时由视图 v_style_scene_product 按 ProductID 生成默认路径',
    StyleTag VARCHAR(10) COMMENT '四季色彩标签：春/夏/秋/冬',
    SceneTag VARCHAR(10) COMMENT '场景标签：上课、约会聚会、出游逛街、居家',
    IsSet TINYINT NOT NULL DEFAULT 0 COMMENT '商品形态：0单品，1套装（套装内容见 SetDetail）',
    KEY idx_product_style_scene (StyleTag, SceneTag) COMMENT '穿搭库按季型+场景联合筛选',
    CONSTRAINT fk_product_category FOREIGN KEY(CategoryID) REFERENCES Category(CategoryID),
    CHECK(Stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品（单品/套装）';

-- ==============================================
-- 【二、表结构 4/11】套装明细表 SetDetail
-- ==============================================
DROP TABLE IF EXISTS SetDetail;
CREATE TABLE SetDetail(
    SetProductID INT COMMENT '套装商品ID',
    ItemProductID INT COMMENT '单品商品ID',
    Quantity INT NOT NULL DEFAULT 1 COMMENT '套装内该单品的件数',
    PRIMARY KEY(SetProductID,ItemProductID),
    CONSTRAINT fk_setdetail_set FOREIGN KEY(SetProductID) REFERENCES Product(ProductID),
    CONSTRAINT fk_setdetail_item FOREIGN KEY(ItemProductID) REFERENCES Product(ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='套装明细';

-- ==============================================
-- 【二、表结构 5/11】风格题目表 StyleQuestion
-- ==============================================
DROP TABLE IF EXISTS StyleQuestion;
CREATE TABLE StyleQuestion(
    QuestionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '题目编号',
    QuestionNo INT NOT NULL UNIQUE COMMENT '题目题号，答题顺序以此排序',
    QuestionText VARCHAR(200) COMMENT '问卷题目内容'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='四季色彩测试题目';

-- ==============================================
-- 【二、表结构 6/11】风格选项表 StyleOption（StyleTag 取春/夏/秋/冬，Score 支持 0.5 步进）
-- ==============================================
DROP TABLE IF EXISTS StyleOption;
CREATE TABLE StyleOption(
    OptionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '选项编号',
    QuestionID INT NOT NULL COMMENT '所属题目外键',
    OptionLetter CHAR(1) COMMENT '选项字母，取值 A/B/C',
    OptionText VARCHAR(100) COMMENT '选项文字',
    StyleTag VARCHAR(10) COMMENT '对应四季标签：春/夏/秋/冬',
    Score DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT '该选项计入对应季型的得分，支持 0.5 步进',
    CONSTRAINT fk_option_question FOREIGN KEY(QuestionID) REFERENCES StyleQuestion(QuestionID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='四季色彩测试选项';

-- ==============================================
-- 【二、表结构 7/11】风格测试结果表 StyleTestResult（四季得分支持小数）
-- ==============================================
DROP TABLE IF EXISTS StyleTestResult;
CREATE TABLE StyleTestResult(
    TestID INT PRIMARY KEY AUTO_INCREMENT COMMENT '测试记录ID',
    UserID INT NOT NULL COMMENT '用户外键',
    TestTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '测试时间',
    spring_score DECIMAL(3,1) DEFAULT 0 COMMENT '春型得分',
    summer_score DECIMAL(3,1) DEFAULT 0 COMMENT '夏型得分',
    autumn_score DECIMAL(3,1) DEFAULT 0 COMMENT '秋型得分',
    winter_score DECIMAL(3,1) DEFAULT 0 COMMENT '冬型得分',
    FinalStyleTag VARCHAR(10) COMMENT '最终季型结果枚举：春/夏/秋/冬',
    KEY idx_test_user_time (UserID, TestTime) COMMENT '我的测试记录按时间倒序，覆盖 fk_test_user 前缀',
    CONSTRAINT fk_test_user FOREIGN KEY(UserID) REFERENCES User(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户四季色彩测试结果';

-- ==============================================
-- 【二、表结构 8/11】购物车 Cart
-- ==============================================
DROP TABLE IF EXISTS Cart;
CREATE TABLE Cart(
    CartID INT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车记录ID',
    UserID INT NOT NULL COMMENT '用户外键',
    ProductID INT NOT NULL COMMENT '商品外键',
    Quantity INT NOT NULL COMMENT '购买数量，取值范围 1-99',
    AddTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    UNIQUE KEY uk_cart_user_product (UserID, ProductID) COMMENT '同一用户同一商品只保留一行，覆盖 fk_cart_user 前缀，避免并发重复加购',
    CONSTRAINT fk_cart_user FOREIGN KEY(UserID) REFERENCES User(UserID),
    CONSTRAINT fk_cart_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID),
    CHECK(Quantity BETWEEN 1 AND 99)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='购物车';

-- ==============================================
-- 【二、表结构 9/11】订单表 Orders
-- ==============================================
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders(
    OrderID INT PRIMARY KEY AUTO_INCREMENT COMMENT '订单编号',
    UserID INT NOT NULL COMMENT '用户外键',
    OrderTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
    TotalAmount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '订单总金额，由购物车明细汇总',
    OrderStatus VARCHAR(10) DEFAULT '已付款' COMMENT '订单状态枚举：待付款/已付款/已发货',
    KEY idx_orders_user_time (UserID, OrderTime) COMMENT '我的订单按时间倒序分页，覆盖 fk_order_user 前缀',
    CONSTRAINT fk_order_user FOREIGN KEY(UserID) REFERENCES User(UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单主表';

-- ==============================================
-- 【二、表结构 10/11】订单明细表 OrderItem
-- ==============================================
DROP TABLE IF EXISTS OrderItem;
CREATE TABLE OrderItem(
    ItemID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细编号',
    OrderID INT NOT NULL COMMENT '订单外键',
    ProductID INT NOT NULL COMMENT '商品外键',
    Quantity INT NOT NULL COMMENT '购买数量',
    UnitPrice DECIMAL(10,2) COMMENT '成交单价',
    KEY idx_item_order (OrderID) COMMENT '按订单汇总明细，覆盖 fk_item_order 前缀',
    CONSTRAINT fk_item_order FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT fk_item_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单明细';

-- ==============================================
-- 【二、表结构 11/11】库存流水 StockRecord
-- ==============================================
DROP TABLE IF EXISTS StockRecord;
CREATE TABLE StockRecord(
    RecordID INT PRIMARY KEY AUTO_INCREMENT COMMENT '流水编号',
    ProductID INT NOT NULL COMMENT '商品外键',
    ChangeQty INT NOT NULL COMMENT '变动量：下单扣库存负数，退款正数',
    ChangeType VARCHAR(10) NOT NULL DEFAULT '下单' COMMENT '变动类型枚举：下单（扣减）/退款（回补），预留扩展',
    ChangeTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '变动时间',
    KEY idx_stock_product_time (ProductID, ChangeTime) COMMENT '按商品追溯库存变动流水，覆盖 fk_stock_product 前缀',
    CONSTRAINT fk_stock_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='库存变动流水记录';

-- ==============================================
-- 【三、视图】商品推荐视图 v_style_scene_product
-- ==============================================
DROP VIEW IF EXISTS v_style_scene_product;
-- 视图：商品列表专用宽视图（穿搭库/首页共用）
-- 只输出前端卡片与筛选真正读取的列：ProductID、ProductName、CategoryName、Price、
-- StyleTag、SceneTag、IsSet、Image；库存 Stock 由商品详情接口直接读 Product 表返回，故不再冗余输出。
-- 过滤条件 Stock>0 保证列表只出现可售商品；Image 的空值兜底在此统一处理。
CREATE VIEW v_style_scene_product AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    p.Price,
    p.StyleTag,
    p.SceneTag,
    p.IsSet,
    COALESCE(p.Image, CONCAT('images/p', p.ProductID, '.jpg')) AS Image
FROM Product p
LEFT JOIN Category c ON p.CategoryID = c.CategoryID
WHERE p.Stock>0;

-- 示例：查询春型适配商品：SELECT * FROM v_style_scene_product WHERE StyleTag='春';

-- ==============================================
-- 【四、触发器】订单明细插入后扣减库存并写库存流水
-- ==============================================
DROP TRIGGER IF EXISTS trg_orderitem_after_insert;
DELIMITER //
CREATE TRIGGER trg_orderitem_after_insert
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
    DECLARE cur_stock INT DEFAULT NULL;

    SELECT Stock INTO cur_stock FROM Product WHERE ProductID = NEW.ProductID;

    -- 库存下限校验：商品不存在或余量不足时直接抛错，
    -- 由外层存储过程 proc_create_order 的 EXIT HANDLER 捕获并 ROLLBACK，
    -- 避免并发下单把 Stock 扣成负数（原实现只做减法、不做判断）。
    IF cur_stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '库存校验失败：商品不存在';
    ELSEIF cur_stock < NEW.Quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '库存校验失败：商品库存不足';
    END IF;

    UPDATE Product SET Stock = Stock - NEW.Quantity WHERE ProductID = NEW.ProductID;
    INSERT INTO StockRecord(ProductID,ChangeQty,ChangeType)
    VALUES (NEW.ProductID, -NEW.Quantity, '下单');
END //
DELIMITER ;

-- ==============================================
-- 【五、存储过程 1/2】下单业务 proc_create_order
-- （订单+明细写入后由触发器自动扣库存并写流水）
-- ==============================================
DROP PROCEDURE IF EXISTS proc_create_order;
DELIMITER //
CREATE PROCEDURE proc_create_order(IN in_UserID INT,OUT out_ret_msg VARCHAR(50))
BEGIN
    DECLARE total DECIMAL(10,2) DEFAULT 0;
    DECLARE oid INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET out_ret_msg='下单失败：库存不足或数据异常，已回滚';
    END;

    START TRANSACTION;
    -- 明细快照必须落临时表：若 INSERT INTO OrderItem 的 SELECT 直接引用 Product，
    -- AFTER INSERT 触发器再 UPDATE Product 就会触发 MySQL 1442（表已被本语句占用），
    -- 所以先把（商品、数量、成交单价）析出到临时表；金额汇总也复用该快照，
    -- 避免对 Cart/Product 的重复 JOIN（原实现汇总一次、明细再 JOIN 一次）。
    DROP TEMPORARY TABLE IF EXISTS tmp_order_items;
    CREATE TEMPORARY TABLE tmp_order_items (
        ProductID INT           NOT NULL,
        Quantity  INT           NOT NULL,
        UnitPrice DECIMAL(10,2) NOT NULL
    ) ENGINE=MEMORY;

    INSERT INTO tmp_order_items(ProductID, Quantity, UnitPrice)
    SELECT c.ProductID, c.Quantity, p.Price
    FROM Cart c JOIN Product p ON c.ProductID = p.ProductID
    WHERE c.UserID = in_UserID;

    SELECT SUM(Quantity * UnitPrice) INTO total FROM tmp_order_items;

    IF total IS NULL THEN
        SET out_ret_msg='购物车为空，无法下单';
        DROP TEMPORARY TABLE IF EXISTS tmp_order_items;
        ROLLBACK;
    ELSE
        INSERT INTO Orders(UserID,TotalAmount,OrderStatus) VALUES(in_UserID,total,'已付款');
        SET oid = LAST_INSERT_ID();
        -- 库存扣减与库存流水由触发器 trg_orderitem_after_insert 自动完成
        INSERT INTO OrderItem(OrderID,ProductID,Quantity,UnitPrice)
        SELECT oid, ProductID, Quantity, UnitPrice FROM tmp_order_items;
        DROP TEMPORARY TABLE IF EXISTS tmp_order_items;
        DELETE FROM Cart WHERE UserID = in_UserID;
        COMMIT;
    END IF;
END //
DELIMITER ;

-- ==============================================
-- 【五、存储过程 2/2】四季色彩季型人数统计 proc_style_statistic
-- ==============================================
DROP PROCEDURE IF EXISTS proc_style_statistic;
DELIMITER //
CREATE PROCEDURE proc_style_statistic()
BEGIN
    SELECT FinalStyleTag AS 四季色彩季型,COUNT(*) AS 用户数量
    FROM StyleTestResult
    GROUP BY FinalStyleTag;
END //
DELIMITER ;

-- 【附】手动验证用测试调用示例（默认注释，按需放开）
-- SET @msg='';
-- CALL proc_create_order(2,@msg);
-- SELECT @msg;
-- CALL proc_style_statistic();
-- SELECT * FROM v_style_scene_product WHERE StyleTag='春';

-- 【六、测试数据】集中于脚本末尾，按外键依赖顺序：用户→分类→商品→套装明细→题库→选项→购物车→测试结果
-- 说明：数据在视图/触发器/存储过程之后执行，便于单独重导；
--       此处不插入 OrderItem，避免导入过程触发库存下限校验。
-- ==============================================

INSERT INTO User(UserName,Password,NickName,IsAdmin) VALUES
('admin','e10adc3949ba59abbe56e057f20f883e','商城管理员',1),
('stu01','e10adc3949ba59abbe56e057f20f883e','小王同学',0);

INSERT INTO Category(CategoryName) VALUES
('上衣'),('裤装'),('裙装'),('鞋'),('包'),('配饰'),('套装');

INSERT INTO Product(ProductName,CategoryID,Price,Stock,Image,StyleTag,SceneTag,IsSet) VALUES
('清新元气卫衣',1,129.00,20,'images/p1.jpg','春','上课',0),
('复古大地半身长裙',3,159.00,15,'images/p2.jpg','秋','约会聚会',0),
('莫兰迪冷调套装',7,269.00,8,'images/p3.jpg','夏','约会聚会',1),
('冷艳高饱和西装套装',7,559.00,6,'images/p4.jpg','冬','出游逛街',1),
('薄荷绿针织开衫',1,139.00,25,'images/p5.jpg','春','上课',0),
('橘粉碎花连衣裙',3,189.00,18,'images/p6.jpg','春','约会聚会',0),
('米白阔腿休闲裤',2,179.00,22,'images/p7.jpg','春','出游逛街',0),
('奶杏色帆布鞋',4,99.00,30,'images/p8.jpg','春','出游逛街',0),
('浅紫针织短袖',1,119.00,26,'images/p9.jpg','夏','上课',0),
('灰蓝雪纺衬衫',1,149.00,20,'images/p10.jpg','夏','约会聚会',0),
('白色棉麻长裙',3,199.00,16,'images/p11.jpg','夏','出游逛街',0),
('银色细链条包',5,159.00,14,'images/p12.jpg','夏','约会聚会',0),
('驼色羊毛大衣',1,459.00,10,'images/p13.jpg','秋','出游逛街',0),
('砖红色针织半裙',3,169.00,17,'images/p14.jpg','秋','约会聚会',0),
('暖棕乐福鞋',4,229.00,19,'images/p15.jpg','秋','上课',0),
('焦糖色托特包',5,289.00,12,'images/p16.jpg','秋','上课',0),
('藏蓝色双排扣西装',1,399.00,9,'images/p17.jpg','冬','上课',0),
('酒红色缎面连衣裙',3,359.00,7,'images/p18.jpg','冬','约会聚会',0),
('黑白对比阔腿裤',2,259.00,13,'images/p19.jpg','冬','上课',0),
('黑色极简腋下包',5,219.00,11,'images/p20.jpg','冬','约会聚会',0);

INSERT INTO SetDetail(SetProductID,ItemProductID,Quantity) VALUES
(3,9,1),    -- 莫兰迪冷调套装(夏) = 浅紫针织短袖(夏) + 白色棉麻长裙(夏)，合计318，套装价269
(3,11,1),
(4,17,1),   -- 冷艳高饱和西装套装(冬) = 藏蓝双排扣西装(冬) + 黑白对比阔腿裤(冬)，合计658，套装价559
(4,19,1);

INSERT INTO StyleQuestion(QuestionNo, QuestionText) VALUES
(1,'手腕内侧的血管，在自然光下看起来是什么颜色？'),
(2,'你的原生肤色（没晒黑、没化妆）底色是？'),
(3,'你的原生瞳孔（没戴美瞳）颜色是？'),
(4,'你的原生头发颜色（没染过）是？'),
(5,'戴金色首饰和银色首饰，哪个更衬你、更显白？'),
(6,'穿纯白色T恤 vs 米白色T恤，哪个更显你气色好？'),
(7,'穿冷调蓝色上衣 vs 暖调橙色上衣，哪个更显你白？'),
(8,'夏天晒完太阳，你的皮肤会？'),
(9,'你的原生唇色（没涂口红）是？'),
(10,'哪种口红你涂了更显气色？');

-- 第1题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(1,'A','偏蓝/偏紫，很明显','夏',1.0),
(1,'A','偏蓝/偏紫，很明显','冬',1.0),
(1,'B','偏绿/偏橄榄绿，很明显','春',1.0),
(1,'B','偏绿/偏橄榄绿，很明显','秋',1.0),
(1,'C','蓝绿都有，分不清','春',0.5),
(1,'C','蓝绿都有，分不清','夏',0.5),
(1,'C','蓝绿都有，分不清','秋',0.5),
(1,'C','蓝绿都有，分不清','冬',0.5);

-- 第2题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(2,'A','偏粉/偏红/冷白色，没什么黄气','夏',1.0),
(2,'A','偏粉/偏红/冷白色，没什么黄气','冬',1.0),
(2,'B','偏黄/偏暖/橄榄黄，自带暖调','春',1.0),
(2,'B','偏黄/偏暖/橄榄黄，自带暖调','秋',1.0),
(2,'C','很白，冷暖都不明显','春',0.5),
(2,'C','很白，冷暖都不明显','夏',0.5),
(2,'C','很白，冷暖都不明显','秋',0.5),
(2,'C','很白，冷暖都不明显','冬',0.5);

-- 第3题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(3,'A','深黑/冷棕，带点灰调','冬',1.0),
(3,'B','浅棕/琥珀棕，很透亮','春',1.0),
(3,'B','浅棕/琥珀棕，很透亮','夏',1.0),
(3,'C','暖棕/黄棕，偏深','秋',1.0);

-- 第4题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(4,'A','冷黑/深棕带灰调，偏冷','夏',1.0),
(4,'A','冷黑/深棕带灰调，偏冷','冬',1.0),
(4,'B','浅棕/金棕，偏浅','春',1.0),
(4,'C','暖棕/深黄棕，偏暖','秋',1.0);

-- 第5题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(5,'A','银色/白金色，戴金的显土','夏',1.0),
(5,'A','银色/白金色，戴金的显土','冬',1.0),
(5,'B','金色/玫瑰金，戴银的显没气色','春',1.0),
(5,'B','金色/玫瑰金，戴银的显没气色','秋',1.0),
(5,'C','都差不多，没区别','春',0.5),
(5,'C','都差不多，没区别','夏',0.5),
(5,'C','都差不多，没区别','秋',0.5),
(5,'C','都差不多，没区别','冬',0.5);

-- 第6题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(6,'A','纯白色，穿米白的显我发黄','夏',1.0),
(6,'A','纯白色，穿米白的显我发黄','冬',1.0),
(6,'B','米白色，穿纯白的显我脸发青','春',1.0),
(6,'B','米白色，穿纯白的显我脸发青','秋',1.0),
(6,'C','都差不多','春',0.5),
(6,'C','都差不多','夏',0.5),
(6,'C','都差不多','秋',0.5),
(6,'C','都差不多','冬',0.5);

-- 第7题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(7,'A','冷调蓝色，穿橙色显我黄气重','夏',1.0),
(7,'A','冷调蓝色，穿橙色显我黄气重','冬',1.0),
(7,'B','暖调橙色，穿蓝色显我脸发灰','春',1.0),
(7,'B','暖调橙色，穿蓝色显我脸发灰','秋',1.0),
(7,'C','都差不多','春',0.5),
(7,'C','都差不多','夏',0.5),
(7,'C','都差不多','秋',0.5),
(7,'C','都差不多','冬',0.5);

-- 第8题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(8,'A','容易晒伤、发红，很难晒黑','夏',1.0),
(8,'A','容易晒伤、发红，很难晒黑','冬',1.0),
(8,'B','很容易晒成健康小麦色，不怎么红','春',1.0),
(8,'B','很容易晒成健康小麦色，不怎么红','秋',1.0),
(8,'C','先红，然后慢慢变黑','春',0.5),
(8,'C','先红，然后慢慢变黑','夏',0.5),
(8,'C','先红，然后慢慢变黑','秋',0.5),
(8,'C','先红，然后慢慢变黑','冬',0.5);

-- 第9题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(9,'A','偏粉/偏紫，很淡','夏',1.0),
(9,'B','偏橘/偏红，很亮','春',1.0),
(9,'C','偏深棕/偏暗，很浓','秋',1.0),
(9,'C','偏深棕/偏暗，很浓','冬',1.0);

-- 第10题
INSERT INTO StyleOption(QuestionID,OptionLetter,OptionText,StyleTag,Score) VALUES
(10,'A','粉紫调/玫瑰调，橘调显土','夏',1.0),
(10,'A','粉紫调/玫瑰调，橘调显土','冬',1.0),
(10,'B','橘调/砖红/暖豆沙，粉紫调显没气色','春',1.0),
(10,'B','橘调/砖红/暖豆沙，粉紫调显没气色','秋',1.0),
(10,'C','都差不多','春',0.5),
(10,'C','都差不多','夏',0.5),
(10,'C','都差不多','秋',0.5),
(10,'C','都差不多','冬',0.5);

INSERT INTO Cart(UserID,ProductID,Quantity) VALUES (2,1,2);

-- 模拟一条测试结果：用户stu01(UserID=2)测试结果为春
INSERT INTO StyleTestResult(UserID,spring_score,summer_score,autumn_score,winter_score,FinalStyleTag)
VALUES(2,6.0,2.5,1.5,2.0,'春');

-- ==============================================
-- 【七、收尾】恢复外键检查，脚本执行完毕
-- ==============================================

SET FOREIGN_KEY_CHECKS=1;