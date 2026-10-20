-- ==============================================
-- 1. 创建数据库
-- ==============================================
CREATE DATABASE IF NOT EXISTS Goodthing DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Goodthing;

-- 重建脚本：先关闭外键检查，避免 DROP 顺序受外键约束影响
SET FOREIGN_KEY_CHECKS=0;

-- ==============================================
-- 1. 用户表 User
-- ==============================================
DROP TABLE IF EXISTS User;
CREATE TABLE User(
    UserID INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户编号主键',
    UserName VARCHAR(20) NOT NULL UNIQUE COMMENT '用户名',
    Password VARCHAR(32) NOT NULL COMMENT '加密密码',
    NickName VARCHAR(20) COMMENT '昵称',
    Gender VARCHAR(4) COMMENT '性别',
    Phone VARCHAR(20) COMMENT '手机号',
    RegisterTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    IsAdmin TINYINT DEFAULT 0 COMMENT '是否管理员 0普通用户 1管理员'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ==============================================
-- 2.商品分类表 Category
-- ==============================================
DROP TABLE IF EXISTS Category;
CREATE TABLE Category(
    CategoryID INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类编号',
    CategoryName VARCHAR(20) NOT NULL UNIQUE COMMENT '分类名称'
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类';

-- ==============================================
-- 3.商品表 Product
-- StyleTag 现在存：春 / 夏 / 秋 / 冬
-- ==============================================
DROP TABLE IF EXISTS Product;
CREATE TABLE Product(
    ProductID INT PRIMARY KEY AUTO_INCREMENT COMMENT '商品编号',
    ProductName VARCHAR(50) NOT NULL COMMENT '商品名称',
    CategoryID INT COMMENT '分类外键',
    Price DECIMAL(10,2) COMMENT '商品价格',
    Stock INT NOT NULL DEFAULT 0 COMMENT '库存，不能负数',
    Image VARCHAR(100) COMMENT '图片路径',
    StyleTag VARCHAR(10) COMMENT '四季色彩标签：春/夏/秋/冬',
    SceneTag VARCHAR(10) COMMENT '场景标签：上课、约会聚会、出游逛街、居家',
    IsSet TINYINT DEFAULT 0 COMMENT '0单品，1套装',
    CONSTRAINT fk_product_category FOREIGN KEY(CategoryID) REFERENCES Category(CategoryID),
    CHECK(Stock >= 0)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品（单品/套装）';

-- ==============================================
-- 4.套装明细表 SetDetail
-- ==============================================
DROP TABLE IF EXISTS SetDetail;
CREATE TABLE SetDetail(
    SetProductID INT COMMENT '套装商品ID',
    ItemProductID INT COMMENT '单品商品ID',
    Quantity INT NOT NULL DEFAULT 1 COMMENT '套装内单品数量',
    PRIMARY KEY(SetProductID,ItemProductID),
    CONSTRAINT fk_setdetail_set FOREIGN KEY(SetProductID) REFERENCES Product(ProductID),
    CONSTRAINT fk_setdetail_item FOREIGN KEY(ItemProductID) REFERENCES Product(ProductID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='套装明细';

-- ==============================================
-- 5.风格题目表 StyleQuestion
-- ==============================================
DROP TABLE IF EXISTS StyleQuestion;
CREATE TABLE StyleQuestion(
    QuestionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '题目编号',
    QuestionNo INT COMMENT '题目题号',
    QuestionText VARCHAR(200) COMMENT '问卷题目内容'
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='四季色彩测试题目';

-- ==============================================
-- 6.风格选项表 StyleOption
-- StyleTag：春、夏、秋、冬；Score支持小数0.5
-- ==============================================
DROP TABLE IF EXISTS StyleOption;
CREATE TABLE StyleOption(
    OptionID INT PRIMARY KEY AUTO_INCREMENT COMMENT '选项编号',
    QuestionID INT NOT NULL COMMENT '所属题目外键',
    OptionLetter CHAR(1) COMMENT '选项A/B/C',
    OptionText VARCHAR(100) COMMENT '选项文字',
    StyleTag VARCHAR(10) COMMENT '对应四季标签：春/夏/秋/冬',
    Score DECIMAL(3,1) COMMENT '该选项对应季型得分，支持0.5',
    CONSTRAINT fk_option_question FOREIGN KEY(QuestionID) REFERENCES StyleQuestion(QuestionID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='四季色彩测试选项';

-- ==============================================
-- 7.【重点修改】风格测试结果表 StyleTestResult
-- 删除原来6种风格得分，改为春夏秋冬4个得分，支持小数
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
    FinalStyleTag VARCHAR(10) COMMENT '最终季型结果：春/夏/秋/冬',
    CONSTRAINT fk_test_user FOREIGN KEY(UserID) REFERENCES User(UserID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户四季色彩测试结果';

-- ==============================================
-- 8.购物车 Cart
-- ==============================================
DROP TABLE IF EXISTS Cart;
CREATE TABLE Cart(
    CartID INT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车记录ID',
    UserID INT NOT NULL COMMENT '用户外键',
    ProductID INT NOT NULL COMMENT '商品外键',
    Quantity INT NOT NULL COMMENT '数量1‑99',
    AddTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    CONSTRAINT fk_cart_user FOREIGN KEY(UserID) REFERENCES User(UserID),
    CONSTRAINT fk_cart_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID),
    CHECK(Quantity BETWEEN 1 AND 99)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车';

-- ==============================================
-- 9.订单表 Orders
-- ==============================================
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders(
    OrderID INT PRIMARY KEY AUTO_INCREMENT COMMENT '订单编号',
    UserID INT NOT NULL COMMENT '用户外键',
    OrderTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
    TotalAmount DECIMAL(10,2) COMMENT '订单总金额',
    OrderStatus VARCHAR(10) COMMENT '订单状态：待付款/已付款/已发货',
    CONSTRAINT fk_order_user FOREIGN KEY(UserID) REFERENCES User(UserID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- ==============================================
-- 10.订单明细表 OrderItem
-- ==============================================
DROP TABLE IF EXISTS OrderItem;
CREATE TABLE OrderItem(
    ItemID INT PRIMARY KEY AUTO_INCREMENT COMMENT '明细编号',
    OrderID INT NOT NULL COMMENT '订单外键',
    ProductID INT NOT NULL COMMENT '商品外键',
    Quantity INT NOT NULL COMMENT '购买数量',
    UnitPrice DECIMAL(10,2) COMMENT '成交单价',
    CONSTRAINT fk_item_order FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT fk_item_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细';

-- ==============================================
-- 11.库存流水 StockRecord
-- ==============================================
DROP TABLE IF EXISTS StockRecord;
CREATE TABLE StockRecord(
    RecordID INT PRIMARY KEY AUTO_INCREMENT COMMENT '流水编号',
    ProductID INT NOT NULL COMMENT '商品外键',
    ChangeQty INT NOT NULL COMMENT '变动量：下单扣库存负数，退款正数',
    ChangeType VARCHAR(10) COMMENT '变动类型：下单、退款',
    ChangeTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '变动时间',
    CONSTRAINT fk_stock_product FOREIGN KEY(ProductID) REFERENCES Product(ProductID)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存变动流水记录';

-- ==============================================
-- 插入四季色彩 10道测试题目
-- ==============================================
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

-- ==============================================
-- 插入10题全部A/B/C选项数据
-- ==============================================
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

-- ==============================================
-- 基础样例测试数据
-- ==============================================
INSERT INTO User(UserName,Password,NickName,IsAdmin) VALUES
('admin','e10adc3949ba59abbe56e057f20f883e','商城管理员',1),
('stu01','e10adc3949ba59abbe56e057f20f883e','小王同学',0);

INSERT INTO Category(CategoryName) VALUES
('上衣'),('裤装'),('裙装'),('鞋'),('包'),('配饰'),('套装');

-- 商品StyleTag打上四季标签
INSERT INTO Product(ProductName,CategoryID,Price,Stock,StyleTag,SceneTag,IsSet) VALUES
('清新元气卫衣',1,129.00,20,'春','上课',0),
('复古大地半身长裙',3,159.00,15,'秋','约会聚会',0),
('莫兰迪冷调套装',7,269.00,8,'夏','约会聚会',1),
('冷艳高饱和西装套装',7,329.00,6,'冬','出游逛街',1);

INSERT INTO SetDetail(SetProductID,ItemProductID,Quantity) VALUES
(3,1,1),
(3,2,1);

INSERT INTO Cart(UserID,ProductID,Quantity) VALUES (2,1,2);

-- 模拟一条测试结果：用户stu01(UserID=2)测试结果为春
INSERT INTO StyleTestResult(UserID,spring_score,summer_score,autumn_score,winter_score,FinalStyleTag)
VALUES(2,6.0,2.5,1.5,2.0,'春');

-- ==============================================
-- 视图 v_style_scene_product 商品推荐视图
-- ==============================================
DROP VIEW IF EXISTS v_style_scene_product;
CREATE VIEW v_style_scene_product AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    p.Price,
    p.Stock,
    p.StyleTag,
    p.SceneTag,
    p.IsSet
FROM Product p
LEFT JOIN Category c ON p.CategoryID = c.CategoryID
WHERE p.Stock>0;

-- 示例：查询春型适配商品：SELECT * FROM v_style_scene_product WHERE StyleTag='春';

-- ==============================================
-- 触发器：订单明细插入后自动扣减库存并写库存流水
-- ==============================================
DROP TRIGGER IF EXISTS trg_orderitem_after_insert;
DELIMITER //
CREATE TRIGGER trg_orderitem_after_insert
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
    UPDATE Product SET Stock = Stock - NEW.Quantity WHERE ProductID = NEW.ProductID;
    INSERT INTO StockRecord(ProductID,ChangeQty,ChangeType)
    VALUES (NEW.ProductID, -NEW.Quantity, '下单');
END //
DELIMITER ;

-- ==============================================
-- 存储过程1：下单业务 proc_create_order
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
        SET out_ret_msg='下单失败，库存不足或者数据异常';
    END;

    START TRANSACTION;
    SELECT SUM(c.Quantity * p.Price) INTO total
    FROM Cart c JOIN Product p ON c.ProductID=p.ProductID
    WHERE c.UserID = in_UserID;

    IF total IS NULL THEN
        SET out_ret_msg='购物车为空，无法下单';
        ROLLBACK;
    ELSE
        INSERT INTO Orders(UserID,TotalAmount,OrderStatus) VALUES(in_UserID,total,'已付款');
        SET oid = LAST_INSERT_ID();

        -- 先用临时表取出明细（避免 INSERT 语句直接引用 Product，
        -- 否则触发器更新 Product 会触发 MySQL 1442 限制）
        CREATE TEMPORARY TABLE tmp_order_items AS
        SELECT c.ProductID, c.Quantity, p.Price AS UnitPrice
        FROM Cart c JOIN Product p ON c.ProductID=p.ProductID
        WHERE c.UserID = in_UserID;

        INSERT INTO OrderItem(OrderID,ProductID,Quantity,UnitPrice)
        SELECT oid, ProductID, Quantity, UnitPrice FROM tmp_order_items;

        DROP TEMPORARY TABLE IF EXISTS tmp_order_items;

        -- 库存扣减与库存流水由触发器 trg_orderitem_after_insert 自动完成

        DELETE FROM Cart WHERE UserID = in_UserID;

        COMMIT;
        SET out_ret_msg=CONCAT('下单成功，订单编号：',oid);
    END IF;
END //
DELIMITER ;

-- ==============================================
-- 存储过程2【已重写】统计四季色彩季型人数 proc_style_statistic
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

-- =================测试调用示例=================
-- SET @msg='';
-- CALL proc_create_order(2,@msg);
-- SELECT @msg;
-- CALL proc_style_statistic();
-- SELECT * FROM v_style_scene_product WHERE StyleTag='春';

-- 重建脚本结束：恢复外键检查
SET FOREIGN_KEY_CHECKS=1;