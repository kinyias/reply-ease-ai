import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.product import Product
from app.models.helpdesk import HelpDesk
from app.models.filter_question import FilterQuestions
from app.models.customer import Customer
from app.models.customer_response import CustomerResponses
from app.models.chatroom import ChatRoom
from app.models.chat_message import ChatMessage
from app.models.booking import Bookings
from app.models.enums import Role
from app.models.user import User
from app.models.domain import Domain
from app.services import vector_service

USER_ID = uuid.UUID("94441c79-7cc6-4768-91c8-ee25a6794fe3")
DOMAIN_ID = uuid.UUID("02c09d6e-f3cb-46e5-9171-c067662a3929")

PRODUCTS_DATA = [
    # Quần áo
    {
        "name": "Áo sơ mi lụa tơ tằm cổ vest cao cấp",
        "price": 450000,
        "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Đầm maxi hoa nhí voan tơ dáng xòe tiểu thư",
        "price": 620000,
        "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Áo blazer oversize form rộng phong cách Hàn Quốc",
        "price": 790000,
        "image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Quần tây âu ống suông lưng cao tôn dáng",
        "price": 380000,
        "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Áo thun cotton unisex basic thoáng khí",
        "price": 220000,
        "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Quần jeans ống đứng retro wash xanh cổ điển",
        "price": 480000,
        "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Áo len dệt kim cổ lọ mềm mại thu đông",
        "price": 420000,
        "image": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Chân váy chữ A midi xẻ tà thanh lịch",
        "price": 350000,
        "image": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80",
    },
    # Túi xách
    {
        "name": "Túi xách nữ kẹp nách baguette da sần phong cách 90s",
        "price": 550000,
        "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Balo da mini phối khóa kim loại mạ vàng sang trọng",
        "price": 680000,
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Túi tote canvas cao cấp phối quai da đựng laptop",
        "price": 320000,
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Túi đeo chéo da chần bông quả trám dây xích vàng",
        "price": 720000,
        "image": "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Ví cầm tay clutch dự tiệc ánh kim đính đá lấp lánh",
        "price": 490000,
        "image": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Túi bao tử đeo chéo unisex da bò sáp năng động",
        "price": 390000,
        "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
    },
    # Giày dép
    {
        "name": "Giày sneaker cổ thấp da trắng phối viền xám",
        "price": 650000,
        "image": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Giày cao gót mũi nhọn 7cm da bóng kiêu sa",
        "price": 580000,
        "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Giày sandal quai mảnh gót vuông thanh mảnh dạo phố",
        "price": 360000,
        "image": "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Giày lười Loafer da đen bóng đế đúc thời thượng",
        "price": 690000,
        "image": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Giày chelsea boots da lộn màu nâu bò cá tính",
        "price": 850000,
        "image": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80",
    },
    {
        "name": "Giày tây Oxford da bò nguyên tấm sang trọng lịch lãm",
        "price": 1150000,
        "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80",
    },
]

HELPDESK_FAQS = [
    {
        "question": "Chính sách đổi trả hàng của shop như thế nào?",
        "answer": "Shop hỗ trợ đổi size hoặc đổi mẫu trong vòng 7 ngày kể từ khi nhận hàng. Yêu cầu sản phẩm còn nguyên tem mác, hộp đựng và chưa qua sử dụng hay giặt tẩy.",
    },
    {
        "question": "Thời gian và chi phí giao hàng mất bao lâu?",
        "answer": "Nội thành nhận hàng trong 24h (đồng giá 20.000 VND, miễn phí ship cho đơn từ 500.000 VND). Các tỉnh thành khác từ 2-4 ngày làm việc (phí 30.000 VND).",
    },
    {
        "question": "Làm cách nào để tôi chọn đúng size quần áo và giày?",
        "answer": "Mỗi trang sản phẩm đều có bảng quy đổi size chi tiết. Bạn có thể nhắn tin trực tiếp số đo chiều cao, cân nặng hoặc chiều dài bàn chân để chuyên viên tư vấn hỗ trợ chọn size chuẩn nhất.",
    },
    {
        "question": "Cửa hàng có dịch vụ thử đồ trực tiếp và đặt lịch hẹn trước không?",
        "answer": "Có ạ! Quý khách có thể đặt lịch hẹn thử đồ trực tiếp qua chatbot. Chúng mình sẽ chuẩn bị sẵn phòng thử đồ riêng và các trang phục theo kích thước yêu cầu của bạn.",
    },
    {
        "question": "Các hình thức thanh toán được hỗ trợ tại cửa hàng là gì?",
        "answer": "Cửa hàng hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng qua mã QR động (SePay/VietQR) và thẻ tín dụng/ghi nợ quốc tế qua cổng thanh toán bảo mật.",
    },
]

FILTER_QUESTIONS = [
    "Bạn đang tìm kiếm trang phục hoặc phụ kiện cho dịp nào (đi làm, dạo phố hay dự tiệc)?",
    "Bạn quan tâm đến sản phẩm dành cho nam hay nữ, và kích cỡ (size) dự kiến là bao nhiêu?",
    "Mức ngân sách bạn dự định chi tiêu cho đợt mua sắm này là khoảng bao nhiêu?",
    "Bạn ưa chuộng phong cách thời trang nào nhất (tối giản, thanh lịch, năng động cá tính hay sang trọng)?",
    "Bạn có cần nhận hàng hỏa tốc trong ngày hay theo hình thức vận chuyển tiêu chuẩn?",
]

CUSTOMERS_AND_CHATS = [
    {
        "email": "lananh.tran92@gmail.com",
        "name": "Lan Anh",
        "messages": [
            ("user", "Chào shop, mình muốn tìm một chiếc đầm đi tiệc cưới cuối tuần này"),
            ("assistant", "Chào bạn Lan Anh! Shop hiện có mẫu 'Đầm maxi hoa nhí voan tơ dáng xòe tiểu thư' giá 620,000 VND rất được ưa chuộng cho dịp tiệc cưới. Bạn muốn xem thử mẫu này không ạ?"),
            ("user", "Đầm đó mình cao 1m60 nặng 49kg mặc size gì vừa bạn nhỉ?"),
            ("assistant", "Dạ với chiều cao 1m60 và cân nặng 49kg, bạn mặc size S là cực kỳ tôn dáng và vừa vặn luôn ạ! Mẫu này có lớp lót lụa mềm và đường chiết eo rất khéo."),
            ("user", "Tốt quá, chất vải có mát không shop?"),
            ("assistant", "Chất voan tơ cao cấp nhẹ bay bổng, có lót lụa habutai thấm hút mồ hôi nên mặc thoáng mát cả ngày bạn nhé!"),
            ("user", "Bạn gửi thông tin qua email lananh.tran92@gmail.com giúp mình nhé, mình muốn đặt lịch qua thử đồ luôn"),
            ("assistant", "Dạ shop đã ghi nhận email lananh.tran92@gmail.com của bạn. Shop xin hỗ trợ bạn đặt lịch hẹn thử đồ tại showroom ngay ạ!"),
        ],
        "booking": {"slot": "10:00 - 11:00", "days_ahead": 1},
    },
    {
        "email": "hoangnam.sneaker@gmail.com",
        "name": "Hoàng Nam",
        "messages": [
            ("user", "Shop có mẫu giày sneaker da trắng nào đi êm chân không?"),
            ("assistant", "Chào bạn Nam! Shop có mẫu 'Giày sneaker cổ thấp da trắng phối viền xám' giá 650,000 VND, lót đệm memory foam đi cực êm và chống mỏi chân."),
            ("user", "Chân mình đi size 42, form giày này chuẩn size hay cần tăng size vậy shop?"),
            ("assistant", "Dạ form giày chuẩn size thể thao quốc tế ạ, bạn đi size 42 thì chọn đúng size 42 là vừa vặn thoải mái luôn nhé!"),
            ("user", "Giày có chống nước nhẹ khi đi mưa nhỏ không?"),
            ("assistant", "Phần da microfiber cao cấp được xử lý chống thấm nước nhẹ, bạn đi mưa nhỏ hoặc lau chùi vết bẩn rất dễ dàng ạ."),
            ("user", "Tuyệt vời, email mình là hoangnam.sneaker@gmail.com, shop giữ cho mình 1 đôi size 42 nha"),
            ("assistant", "Dạ shop đã giữ sẵn 1 đôi sneaker size 42 cho bạn và gửi xác nhận về hoangnam.sneaker@gmail.com rồi ạ!"),
        ],
        "booking": {"slot": "14:30 - 15:30", "days_ahead": 2},
    },
    {
        "email": "thuylinh.fashion@gmail.com",
        "name": "Thùy Linh",
        "messages": [
            ("user", "Cho mình hỏi áo sơ mi lụa tơ tằm cổ vest giá bao nhiêu vậy?"),
            ("assistant", "Dạ mẫu 'Áo sơ mi lụa tơ tằm cổ vest cao cấp' có giá 450,000 VND bạn nha. Mẫu này phối với quần tây âu hoặc chân váy đều cực kỳ sang chảnh."),
            ("user", "Áo này có màu trắng kem và be không?"),
            ("assistant", "Dạ bên mình có đủ màu Trắng ngọc trai, Be sữa và Xanh navy nhạt ạ."),
            ("user", "Chất liệu có dễ nhăn khi giặt máy không bạn?"),
            ("assistant", "Chất lụa dệt pha sợi chống nhăn cao cấp nên hạn chế nhăn tối đa, tuy nhiên shop khuyên bạn nên cho vào túi giặt hoặc giặt tay để áo giữ phom đẹp nhất ạ."),
            ("user", "Oki shop, email mình thuylinh.fashion@gmail.com, gửi mình ảnh chụp thật màu be nhé!"),
            ("assistant", "Dạ shop đã gửi catalog hình ảnh thật qua email thuylinh.fashion@gmail.com cho bạn rồi ạ!"),
        ],
        "booking": {"slot": "09:30 - 10:30", "days_ahead": 3},
    },
    {
        "email": "minhtuan.dev88@gmail.com",
        "name": "Minh Tuấn",
        "messages": [
            ("user", "Shop có túi hoặc balo nào đựng vừa macbook 14 inch không?"),
            ("assistant", "Dạ chào anh Tuấn! Mẫu 'Túi tote canvas cao cấp phối quai da đựng laptop' giá 320,000 VND có ngăn chống sốc chuyên dụng đựng vừa vặn laptop từ 13 - 15.6 inch ạ."),
            ("user", "Quai đeo có êm vai không bạn, túi chịu tải được bao nhiêu kg?"),
            ("assistant", "Quai túi bằng da bọc đệm êm, chịu lực lên đến 8-10kg thoải mái, đường may viền bọ đôi gia cố cực kỳ chắc chắn ạ."),
            ("user", "Màu đen còn hàng không shop?"),
            ("assistant", "Dạ mẫu túi tote màu đen phối da bò sáp vẫn còn sẵn hàng tại cửa hàng ạ."),
            ("user", "Gửi cho mình thông tin đặt hàng qua minhtuan.dev88@gmail.com nhé"),
            ("assistant", "Dạ shop đã gửi chi tiết sản phẩm và hướng dẫn đặt hàng tới minhtuan.dev88@gmail.com rồi ạ! Cảm ơn anh Tuấn!"),
        ],
        "booking": {"slot": "16:00 - 17:00", "days_ahead": 1},
    },
    {
        "email": "phuongthao.style@gmail.com",
        "name": "Phương Thảo",
        "messages": [
            ("user", "Áo blazer oversize form rộng Hàn Quốc giá bao nhiêu vậy ạ?"),
            ("assistant", "Dạ 'Áo blazer oversize form rộng phong cách Hàn Quốc' hiện có giá 790,000 VND, áo có đệm vai nhẹ tạo form đứng thanh lịch lắm ạ!"),
            ("user", "Áo này có mấy cúc và dài áo bao nhiêu cm vậy bạn?"),
            ("assistant", "Dạ áo thiết kế 2 cúc phong cách hiện đại, chiều dài áo khoảng 72cm phủ mông nhẹ, rất hợp phối cùng quần jeans hoặc chân váy ạ."),
            ("user", "Mặc mùa thu này có bị nóng không shop?"),
            ("assistant", "Dạ áo may vải tuyết mưa 2 lớp lót lụa mềm, độ dày vừa phải rất thích hợp cho tiết trời mùa thu mát mẻ hoặc ngồi phòng điều hòa ạ."),
            ("user", "Tư vấn giúp mình size qua email phuongthao.style@gmail.com với nhé"),
            ("assistant", "Dạ vâng, shop đã lưu email phuongthao.style@gmail.com của bạn Thảo để gửi bảng tư vấn size chi tiết ngay đây ạ!"),
        ],
        "booking": {"slot": "11:00 - 12:00", "days_ahead": 4},
    },
    {
        "email": "quocbao.design@gmail.com",
        "name": "Quốc Bảo",
        "messages": [
            ("user", "Mình muốn tìm giày tây Oxford da bò đi làm công sở"),
            ("assistant", "Chào anh Bảo! Shop gợi ý mẫu 'Giày tây Oxford da bò nguyên tấm sang trọng lịch lãm' giá 1,150,000 VND. Da bò nhập khẩu đánh bóng thủ công rất chỉn chu."),
            ("user", "Đế giày là đế phíp hay cao su chống trượt?"),
            ("assistant", "Dạ đế cao su cao cấp kết hợp vân phíp chống trơn trượt tối đa và không gây tiếng ồn lộp cộp khi di chuyển trong văn phòng ạ."),
            ("user", "Shop có dịch vụ bảo hành da và keo không?"),
            ("assistant", "Dạ bên mình bảo hành da 12 tháng không nổ bong tróc và bảo hành keo chỉ trọn đời cho anh luôn ạ!"),
            ("user", "Ok bạn, email mình là quocbao.design@gmail.com, chiều mai mình ghé qua thử trực tiếp"),
            ("assistant", "Dạ vâng anh Bảo, shop đã chuẩn bị lịch hẹn tiếp đón anh và lưu thông tin quocbao.design@gmail.com ạ!"),
        ],
        "booking": {"slot": "15:00 - 16:00", "days_ahead": 1},
    },
    {
        "email": "thanhhang.boutique@gmail.com",
        "name": "Thanh Hằng",
        "messages": [
            ("user", "Shop ơi túi xách nữ kẹp nách baguette da sần có những màu nào thế?"),
            ("assistant", "Chào bạn Hằng! Mẫu baguette da sần giá 550,000 VND bên mình có các màu: Đen tuyền, Trắng kem, Nâu caramel và Xanh olive thời thượng ạ."),
            ("user", "Túi có dây đeo chéo dài đi kèm không hay chỉ có quai kẹp nách?"),
            ("assistant", "Dạ túi tặng kèm 2 dây: 1 dây da ngắn kẹp nách và 1 dây da dài có thể điều chỉnh để đeo chéo rất tiện lợi bạn nhé."),
            ("user", "Bên trong có ngăn kéo khóa bí mật không shop?"),
            ("assistant", "Dạ bên trong có 1 ngăn chính rộng rãi và 1 ngăn phụ có khóa kéo an toàn để đựng son phấn và thẻ ngân hàng ạ."),
            ("user", "Gửi hình thật màu nâu qua email thanhhang.boutique@gmail.com cho mình nhé"),
            ("assistant", "Dạ shop đã gửi ảnh cận chất da màu nâu caramel qua thanhhang.boutique@gmail.com rồi bạn Hằng kiểm tra nhé!"),
        ],
        "booking": {"slot": "18:00 - 19:00", "days_ahead": 5},
    },
    {
        "email": "ducviet.shoes@gmail.com",
        "name": "Đức Việt",
        "messages": [
            ("user", "Giày chelsea boots da lộn màu nâu giá bao nhiêu vậy shop?"),
            ("assistant", "Chào anh Việt! Đôi 'Giày chelsea boots da lộn màu nâu bò cá tính' có giá 850,000 VND, cổ chun co giãn dễ xỏ và ôm chân cực đẹp ạ."),
            ("user", "Da lộn vệ sinh có khó không shop?"),
            ("assistant", "Dạ khi mua shop có tặng kèm 1 bàn chải chuyên dụng cho da lộn và bình xịt nano chống bám bụi bẩn nên chăm sóc cực kỳ đơn giản anh nhé."),
            ("user", "Chân mình dài 26cm thì mang size bao nhiêu vừa?"),
            ("assistant", "Dạ chiều dài bàn chân 26cm anh đi size 41 là vừa khít êm chân ạ!"),
            ("user", "Email mình: ducviet.shoes@gmail.com, shop tạo cho mình lịch hẹn ghé qua thử size 41 nha"),
            ("assistant", "Dạ vâng, shop đã lưu thông tin hẹn thử giày và gửi xác nhận qua ducviet.shoes@gmail.com cho anh Việt rồi ạ!"),
        ],
        "booking": {"slot": "17:30 - 18:30", "days_ahead": 2},
    },
    {
        "email": "haivan.vintage@gmail.com",
        "name": "Hải Vân",
        "messages": [
            ("user", "Chân váy chữ A midi xẻ tà thanh lịch chất vải gì thế bạn?"),
            ("assistant", "Dạ chân váy may bằng chất kaki thun umi co giãn nhẹ, giữ form chữ A thẳng đẹp và không bị bai xù khi giặt ạ. Giá là 350,000 VND bạn nha."),
            ("user", "Váy có cạp lót chun co giãn không hay cạp khóa kéo cố định?"),
            ("assistant", "Dạ cạp trước may thẳng lịch sự, cạp sau có đệm thun co giãn kết hợp khóa kéo giọt lệ bên hông, rất thoải mái khi ngồi làm việc cả ngày ạ."),
            ("user", "Mình cao 1m58 thì váy dài tới đâu bạn?"),
            ("assistant", "Dạ váy dài 75cm, bạn 1m58 mặc sẽ qua gối tầm bắp chân trên, đường xẻ tà trước khéo léo giúp chân trông dài hơn hẳn ạ!"),
            ("user", "Bạn gửi thông số size qua email haivan.vintage@gmail.com giúp mình nhé!"),
            ("assistant", "Dạ vâng, shop đã gửi bảng thông số chi tiết tới email haivan.vintage@gmail.com của bạn rồi ạ!"),
        ],
        "booking": {"slot": "13:30 - 14:30", "days_ahead": 3},
    },
    {
        "email": "trongnghia.outfit@gmail.com",
        "name": "Trọng Nghĩa",
        "messages": [
            ("user", "Quần jeans ống đứng retro wash xanh còn size cho người 72kg không bạn?"),
            ("assistant", "Dạ chào anh Nghĩa! Quần jeans retro giá 480,000 VND có size 33 phù hợp cho người từ 70 - 75kg ạ. Form ống đứng mặc rất thoải mái."),
            ("user", "Vải jean cotton 100% hay có co giãn nhẹ vậy em?"),
            ("assistant", "Dạ chất denim 13oz có pha 2% spandex tạo độ co giãn nhẹ, ngồi xe hay hoạt động cả ngày vẫn cực kỳ thoải mái anh nha."),
            ("user", "Chiều dài quần có cần lên gấu không?"),
            ("assistant", "Dạ chiều dài quần khoảng 102cm, nếu anh cao từ 1m73 trở lên thì vừa vặn gót giày, bên em có hỗ trợ lên gấu miễn phí nếu anh cần ạ."),
            ("user", "Ok ghi chú lại giúp anh qua email trongnghia.outfit@gmail.com nhé"),
            ("assistant", "Dạ em đã cập nhật ghi chú và gửi xác nhận vào hòm thư trongnghia.outfit@gmail.com của anh Nghĩa rồi ạ!"),
        ],
        "booking": {"slot": "10:30 - 11:30", "days_ahead": 6},
    },
    {
        "email": "ngocanh.baglover@gmail.com",
        "name": "Ngọc Ánh",
        "messages": [
            ("user", "Shop ơi ví cầm tay clutch dự tiệc ánh kim đính đá có nặng tay không?"),
            ("assistant", "Chào bạn Ngọc Ánh! Mẫu clutch ánh kim giá 490,000 VND có khung kim loại hợp kim nhẹ, chỉ nặng khoảng 350g cầm tay rất nhẹ nhàng và thanh thoát ạ."),
            ("user", "Có đựng vừa iPhone 15 Pro Max không bạn?"),
            ("assistant", "Dạ kích thước clutch là 20cm x 12cm x 5cm, đựng vừa thoải mái iPhone Pro Max cùng son thỏi, phấn cushion và chìa khóa ạ!"),
            ("user", "Mẫu đính đá có dễ bị rớt đá không shop?"),
            ("assistant", "Đá pha lê được cẩn chân chấu kim loại gia nhiệt kép cực kỳ chắc chắn, bảo hành rơi rớt đá trong 6 tháng bạn yên tâm nha."),
            ("user", "Tốt quá, email mình là ngocanh.baglover@gmail.com, cho mình đặt 1 chiếc nha"),
            ("assistant", "Dạ shop đã xác nhận đơn hàng clutch dự tiệc và gửi hóa đơn về ngocanh.baglover@gmail.com rồi ạ!"),
        ],
        "booking": {"slot": "14:00 - 15:00", "days_ahead": 4},
    },
    {
        "email": "vietanh.gentle@gmail.com",
        "name": "Việt Anh",
        "messages": [
            ("user", "Giày lười Loafer da đen đế đúc có size 40 không shop?"),
            ("assistant", "Dạ chào anh Việt Anh! Mẫu 'Giày lười Loafer da đen bóng đế đúc' giá 690,000 VND hiện đang có sẵn size 40 tại showroom ạ."),
            ("user", "Đôi này mang phối với quần âu hoặc quần kaki ngắn được không?"),
            ("assistant", "Dạ phối cực kỳ ăn ý luôn anh! Đi với tất lười giấu cổ phối cùng quần âu gấu lửng mang lại vẻ ngoài lịch lãm kiểu casual sang trọng ạ."),
            ("user", "Da có bị cứng gây đau gót sau khi mới đi không?"),
            ("assistant", "Dạ da viền đệm gót bọc nỉ êm ái, form da thuộc mềm không bị cứng hay cọ rát gót đâu ạ."),
            ("user", "Mình muốn ghé cửa hàng thử, gửi lịch cho mình qua vietanh.gentle@gmail.com nhé"),
            ("assistant", "Dạ shop đã lên lịch hẹn đón tiếp anh Việt Anh và gửi thông báo qua vietanh.gentle@gmail.com ạ!"),
        ],
        "booking": {"slot": "15:30 - 16:30", "days_ahead": 2},
    },
    {
        "email": "kimngan.model@gmail.com",
        "name": "Kim Ngân",
        "messages": [
            ("user", "Shop ơi giày sandal quai mảnh gót vuông cao mấy phân vậy ạ?"),
            ("assistant", "Chào bạn Ngân! Đôi 'Giày sandal quai mảnh gót vuông' giá 360,000 VND có độ cao 5cm vừa vặn, tôn dáng mà đi lại cả ngày không lo mỏi chân."),
            ("user", "Quai mảnh có làm hằn đỏ mu bàn chân không shop?"),
            ("assistant", "Dạ quai da microfiber mềm mịn có mép bo tròn ép nhiệt, không có gờ cấn nên không làm đau hay hằn đỏ chân đâu ạ."),
            ("user", "Mình đi size 37 còn màu kem nude không?"),
            ("assistant", "Dạ màu kem nude size 37 đang có sẵn 2 đôi cuối cùng tại shop ạ!"),
            ("user", "Giữ hàng cho mình nha, email mình là kimngan.model@gmail.com"),
            ("assistant", "Dạ vâng bạn Ngân, shop đã giữ riêng đôi sandal màu kem cho bạn và gửi mã đơn về kimngan.model@gmail.com rồi ạ!"),
        ],
        "booking": {"slot": "16:30 - 17:30", "days_ahead": 3},
    },
    {
        "email": "huyhoang.urban@gmail.com",
        "name": "Huy Hoàng",
        "messages": [
            ("user", "Túi bao tử đeo chéo unisex da bò sáp giá bao nhiêu bạn?"),
            ("assistant", "Dạ 'Túi bao tử đeo chéo unisex da bò sáp' có giá 390,000 VND, thiết kế 3 ngăn kéo khóa phong cách đường phố năng động ạ."),
            ("user", "Khóa kéo kim loại trơn tru không shop, có bị kẹt rít không?"),
            ("assistant", "Dạ bên em sử dụng khóa kéo răng đồng YKK chống gỉ sét, kéo cực êm và có độ bền bỉ rất cao anh nhé."),
            ("user", "Dây đeo có nới dài để đeo trước ngực hoặc sau lưng được không?"),
            ("assistant", "Dạ dây bản to 3.8cm có khóa cài bấm nhanh và nới dài tối đa 120cm, đeo trước ngực hay chéo sau lưng đều rất phong cách ạ."),
            ("user", "Shop chốt giúp mình 1 chiếc gửi về huyhoang.urban@gmail.com nha"),
            ("assistant", "Dạ shop đã hoàn tất đơn và gửi chi tiết giao nhận qua email huyhoang.urban@gmail.com cho anh Hoàng rồi ạ!"),
        ],
        "booking": {"slot": "09:00 - 10:00", "days_ahead": 5},
    },
    {
        "email": "myduyen.chic@gmail.com",
        "name": "Mỹ Duyên",
        "messages": [
            ("user", "Túi đeo chéo da chần bông quả trám dây xích vàng kích thước bao nhiêu shop?"),
            ("assistant", "Chào bạn Mỹ Duyên! Mẫu túi chần bông giá 720,000 VND có size 24cm x 16cm x 8cm, khoang chứa vừa điện thoại, ví dài và đồ trang điểm ạ."),
            ("user", "Dây xích vàng có bị xỉn màu sau thời gian sử dụng không?"),
            ("assistant", "Dạ dây xích được mạ tĩnh điện phủ lớp nano chống oxy hóa, đảm bảo độ sáng bóng bền lâu và không bị phai màu theo thời gian bạn nhé."),
            ("user", "Mẫu này đeo đi tiệc hay đi làm đều hợp đúng không shop?"),
            ("assistant", "Dạ đúng rồi ạ, dây có thể chỉnh đeo ngắn 1 bên vai đi làm hoặc rút dài đeo chéo đi tiệc cực kỳ đa năng và quý phái ạ!"),
            ("user", "Email mình là myduyen.chic@gmail.com, shop lên lịch tư vấn giúp mình"),
            ("assistant", "Dạ shop đã đặt lịch hẹn tư vấn và gửi thông tin về email myduyen.chic@gmail.com cho bạn Mỹ Duyên rồi ạ!"),
        ],
        "booking": {"slot": "11:30 - 12:30", "days_ahead": 4},
    },
    {
        "email": "tuananh.streetwear@gmail.com",
        "name": "Tuấn Anh",
        "messages": [
            ("user", "Áo thun cotton unisex basic bên mình định lượng vải bao nhiêu gsm?"),
            ("assistant", "Chào bạn Tuấn Anh! Mẫu áo thun unisex basic giá 220,000 VND may từ chất cotton 2 chiều định lượng 250gsm, dày dặn đứng form nhưng không bí nóng."),
            ("user", "Cổ áo giặt có bị dão hay xù lông không shop?"),
            ("assistant", "Dạ cổ áo bo dệt sợi spandex tỉ lệ cao có trần đè viền chỉ móc xích, giặt máy thoải mái không lo bai dão hay xù lông đâu ạ."),
            ("user", "Mình 1m75 nặng 68kg mặc size nào cho form thụng đẹp?"),
            ("assistant", "Dạ bạn chọn size L là có form suông rộng rãi chuẩn phong cách streetwear Hàn Quốc luôn ạ."),
            ("user", "Email của mình: tuananh.streetwear@gmail.com, mình lấy combo 3 màu trắng đen xám nhé"),
            ("assistant", "Dạ shop đã áp dụng ưu đãi combo 3 áo và gửi bill thanh toán vào email tuananh.streetwear@gmail.com cho bạn Tuấn Anh rồi ạ!"),
        ],
        "booking": None,
    },
    {
        "email": "bichngoc.trend@gmail.com",
        "name": "Bích Ngọc",
        "messages": [
            ("user", "Chào shop, áo len dệt kim cổ lọ thu đông có những màu gì vậy?"),
            ("assistant", "Chào bạn Bích Ngọc! Mẫu áo len dệt kim giá 420,000 VND có 4 màu: Nâu mocha, Kem be, Đỏ đô và Đen cơ bản ạ."),
            ("user", "Len có bị châm chích khi mặc trực tiếp vào da không?"),
            ("assistant", "Dạ sợi len lông thỏ tổng hợp siêu mịn, mềm mại êm ái như nhung nên mặc trực tiếp hoàn toàn không bị ngứa hay châm chích bạn nhé."),
            ("user", "Dáng áo ôm hay dáng suông rộng bạn?"),
            ("assistant", "Dạ dáng regular fit ôm nhẹ tôn dáng eo, rất thích hợp mặc trong áo dạ hoặc blazer mùa lạnh ạ."),
            ("user", "Gửi cho mình xem màu nâu mocha qua email bichngoc.trend@gmail.com nhé"),
            ("assistant", "Dạ shop đã gửi hình mẫu phối đồ màu nâu mocha qua email bichngoc.trend@gmail.com rồi bạn Ngọc nhé!"),
        ],
        "booking": None,
    },
    {
        "email": "quanghuy.sneakerhead@gmail.com",
        "name": "Quang Huy",
        "messages": [
            ("user", "Balo da mini phối khóa mạ vàng có vừa cho nam đeo không shop?"),
            ("assistant", "Chào bạn Quang Huy! Balo da mini giá 680,000 VND thiết kế unisex hiện đại, dây đeo dài điều chỉnh linh hoạt nên cả nam và nữ đeo đều rất chất ạ."),
            ("user", "Chất da là da gì vậy bạn?"),
            ("assistant", "Dạ da PU nappa cao cấp có vân hạt sang trọng, chống trầy xước và kháng nước rất tốt khi đi ngoài trời."),
            ("user", "Có bảo hành đường may không shop?"),
            ("assistant", "Dạ bảo hành đường may và khóa kéo 6 tháng đổi mới nếu có lỗi từ nhà sản xuất bạn nhé."),
            ("user", "Gửi mình link thanh toán qua quanghuy.sneakerhead@gmail.com nhé"),
            ("assistant", "Dạ link thanh toán kèm mã giảm giá đã được gửi tới email quanghuy.sneakerhead@gmail.com của bạn rồi ạ!"),
        ],
        "booking": None,
    },
    {
        "email": "thaochi.glamour@gmail.com",
        "name": "Thảo Chi",
        "messages": [
            ("user", "Shop ơi đôi giày cao gót mũi nhọn 7cm da bóng có êm chân không?"),
            ("assistant", "Chào bạn Thảo Chi! Đôi giày cao gót 7cm giá 580,000 VND có lót mút cao su non kháng khuẩn, phân tán áp lực lên bàn chân nên đi lâu vẫn rất êm ạ."),
            ("user", "Gót giày có chắc chắn không, đi có bị chao đảo không?"),
            ("assistant", "Dạ gót giày có lõi thép trợ lực định tâm, gót tiếp đất vững chãi giúp bạn tự tin sải bước trong mọi buổi tiệc."),
            ("user", "Chân mình hơi bè ngang thì có cần nhích lên 1 size không?"),
            ("assistant", "Dạ mũi giày thiết kế form thoải dần, tuy nhiên nếu chân bè ngang bạn nên tăng lên 1 size (size 38 thay vì 37) để ngón chân thoải mái nhất ạ."),
            ("user", "Tư vấn kỹ ghê, email mình là thaochi.glamour@gmail.com, giữ cho mình 1 đôi size 38 nhé"),
            ("assistant", "Dạ shop đã giữ đôi size 38 cho bạn Chi và gửi xác nhận qua hòm thư thaochi.glamour@gmail.com rồi ạ!"),
        ],
        "booking": None,
    },
    {
        "email": "dinhphong.classic@gmail.com",
        "name": "Đình Phong",
        "messages": [
            ("user", "Quần tây âu ống suông lưng cao có những size nào vậy shop?"),
            ("assistant", "Chào anh Đình Phong! Quần tây âu ống suông giá 380,000 VND có đủ size từ S, M, L đến XL cho người từ 50kg đến 80kg ạ."),
            ("user", "Chất vải có bị bóng hay xước khi ngồi ghế văn phòng nhiều không?"),
            ("assistant", "Dạ vải tuysi dệt thoi mật độ sợi cao, bề mặt vải lì tự nhiên, không bóng sờn và không lo xước vải anh nhé."),
            ("user", "Quần có kèm theo móc cài kim loại hay cúc cài truyền thống?"),
            ("assistant", "Dạ cạp quần thiết kế móc cài giấu kiểu Ý hiện đại cùng khóa kéo trơn mượt, tạo vòng bụng phẳng và sang trọng."),
            ("user", "Email mình dinhphong.classic@gmail.com, shop ship COD cho mình 1 chiếc size L về Hà Nội nhé"),
            ("assistant", "Dạ đơn hàng đã được tạo thành công và gửi mã vận đơn qua email dinhphong.classic@gmail.com của anh Phong rồi ạ!"),
        ],
    },
]


async def seed_all():
    print("=" * 65)
    print("🌱 BẮT ĐẦU SEED DỮ LIỆU:")
    print(f"   - User ID: {USER_ID}")
    print(f"   - Domain ID: {DOMAIN_ID}")
    print("=" * 65)

    async with AsyncSessionLocal() as db:
        # 1. Kiểm tra User & Domain
        user_res = await db.execute(select(User).where(User.id == USER_ID))
        user = user_res.scalar_one_or_none()
        if not user:
            print(f"❌ Không tìm thấy user với id: {USER_ID}")
            return

        domain_res = await db.execute(select(Domain).where(Domain.id == DOMAIN_ID))
        domain = domain_res.scalar_one_or_none()
        if not domain:
            print(f"❌ Không tìm thấy domain với id: {DOMAIN_ID}")
            return

        print(f"✅ Đã xác thực User ({user.fullname}) và Domain ({domain.name})")

        # 2. Thêm 20 Sản phẩm (Database + Pinecone)
        print("\n👗 [1/5] Đang thêm 20 sản phẩm vào Database & Pinecone...")
        created_products = []
        for i, p_data in enumerate(PRODUCTS_DATA, start=1):
            product = Product(
                id=uuid.uuid4(),
                name=p_data["name"],
                price=p_data["price"],
                image=p_data["image"],
                domain_id=DOMAIN_ID,
            )
            db.add(product)
            created_products.append(product)

        await db.commit()

        # Sync từng sản phẩm vào Pinecone
        pinecone_product_success = 0
        for p in created_products:
            sync_ok = await vector_service.upsert_knowledge(
                domain_id=DOMAIN_ID,
                record_id=p.id,
                text=f"Sản phẩm: {p.name}. Giá: {p.price:,} VND. Hình ảnh: {p.image}",
                metadata={"type": "product", "name": p.name, "price": p.price},
            )
            if sync_ok:
                pinecone_product_success += 1
            print(f"   [{p.name[:35]:<35}] -> DB: ✅ | Pinecone: {'✅' if sync_ok else '⚠️'}")

        print(f"-> Hoàn tất 20 sản phẩm (Pinecone synced: {pinecone_product_success}/20)")

        # 3. Thêm 5 câu HelpDesk FAQ (Database + Pinecone)
        print("\n❓ [2/5] Đang thêm 5 câu HelpDesk FAQ vào Database & Pinecone...")
        created_faqs = []
        for f_data in HELPDESK_FAQS:
            faq = HelpDesk(
                id=uuid.uuid4(),
                question=f_data["question"],
                answer=f_data["answer"],
                domain_id=DOMAIN_ID,
            )
            db.add(faq)
            created_faqs.append(faq)

        await db.commit()

        pinecone_faq_success = 0
        for f in created_faqs:
            sync_ok = await vector_service.upsert_knowledge(
                domain_id=DOMAIN_ID,
                record_id=f.id,
                text=f"Câu hỏi: {f.question}\nTrả lời: {f.answer}",
                metadata={"type": "helpdesk", "question": f.question},
            )
            if sync_ok:
                pinecone_faq_success += 1
            print(f"   [{f.question[:35]:<35}] -> DB: ✅ | Pinecone: {'✅' if sync_ok else '⚠️'}")

        print(f"-> Hoàn tất 5 HelpDesk FAQ (Pinecone synced: {pinecone_faq_success}/5)")

        # 4. Thêm 5 câu Filter Questions (Database)
        print("\n🎯 [3/5] Đang thêm 5 câu Filter Questions vào Database...")
        created_filter_questions = []
        for q_text in FILTER_QUESTIONS:
            fq = FilterQuestions(
                id=uuid.uuid4(),
                question=q_text,
                answered=None,
                domain_id=DOMAIN_ID,
            )
            db.add(fq)
            created_filter_questions.append(fq)

        await db.commit()
        for fq in created_filter_questions:
            print(f"   [FQ] {fq.question[:45]}... -> DB: ✅")
        print("-> Hoàn tất 5 Filter Questions")

        # 5. Thêm 20 Customers, 20 ChatRooms, Messages & 15 Bookings
        print("\n💬 [4/5] Đang thêm 20 Customers, 20 ChatRooms & ChatMessages giả lập...")
        now = datetime.now(timezone.utc)
        total_messages_count = 0
        created_bookings_count = 0

        # Mẫu câu trả lời cho Filter Questions
        sample_fq_answers = [
            ["Dự tiệc và đi làm", "Nữ, size S/M", "Khoảng 1 - 2 triệu", "Thanh lịch", "Tiêu chuẩn"],
            ["Đi chơi, dạo phố", "Nam, size 42/L", "Dưới 1 triệu", "Năng động cá tính", "Hỏa tốc trong ngày"],
            ["Công sở hàng ngày", "Nữ, size M", "1 - 3 triệu", "Tối giản hiện đại", "Tiêu chuẩn"],
            ["Dự tiệc cưới", "Nữ, size S", "2 - 4 triệu", "Sang trọng", "Gấp trong ngày"],
        ]

        for idx, chat_item in enumerate(CUSTOMERS_AND_CHATS):
            # Tạo Customer
            customer_created_time = now - timedelta(days=(20 - idx), hours=idx * 2)
            customer = Customer(
                id=uuid.uuid4(),
                email=chat_item["email"],
                domain_id=DOMAIN_ID,
                created_at=customer_created_time,
                updated_at=customer_created_time,
            )
            db.add(customer)

            # Tạo Customer Responses (trả lời câu hỏi lọc khách hàng)
            ans_set = sample_fq_answers[idx % len(sample_fq_answers)]
            for q_idx, fq in enumerate(created_filter_questions):
                c_resp = CustomerResponses(
                    id=uuid.uuid4(),
                    question=fq.question,
                    answered=ans_set[q_idx],
                    customer_id=customer.id,
                    created_at=customer_created_time,
                    updated_at=customer_created_time,
                )
                db.add(c_resp)

            # Tạo ChatRoom
            chatroom = ChatRoom(
                id=uuid.uuid4(),
                live=False,
                mailed=False,
                customer_id=customer.id,
                created_at=customer_created_time,
                updated_at=customer_created_time,
            )
            db.add(chatroom)

            # Tạo ChatMessages (5 - 8 messages)
            msg_time = customer_created_time
            for r_str, text_content in chat_item["messages"]:
                msg_time = msg_time + timedelta(minutes=2)
                chat_msg = ChatMessage(
                    id=uuid.uuid4(),
                    message=text_content,
                    role=Role(r_str),
                    seen=True,
                    chat_room_id=chatroom.id,
                    created_at=msg_time,
                    updated_at=msg_time,
                )
                db.add(chat_msg)
                total_messages_count += 1

            # 6. Thêm Lịch hẹn nếu có (15 Bookings)
            if chat_item.get("booking"):
                b_info = chat_item["booking"]
                booking_date = now + timedelta(days=b_info["days_ahead"], hours=3)
                booking = Bookings(
                    id=uuid.uuid4(),
                    date=booking_date,
                    slot=b_info["slot"],
                    email=customer.email,
                    customer_id=customer.id,
                    domain_id=DOMAIN_ID,
                    created_at=customer_created_time,
                    updated_at=customer_created_time,
                )
                db.add(booking)
                created_bookings_count += 1

            print(f"   [Chat #{idx+1:02d}] {chat_item['email']:<32} | {len(chat_item['messages'])} msgs | Booking: {'✅' if chat_item.get('booking') else '-'}")

        await db.commit()
        print(f"-> Hoàn tất 20 ChatRooms, {total_messages_count} Messages, {created_bookings_count} Bookings")

    # Kiểm tra tổng kết số dòng hiện tại
    print("\n" + "=" * 65)
    print("📊 TỔNG KẾT SỐ LƯỢNG TRONG DATABASE SAU KHI SEED:")
    print("=" * 65)
    async with AsyncSessionLocal() as db:
        from sqlalchemy import text
        tables_to_check = [
            "products",
            "help_desks",
            "filter_questions",
            "customers",
            "customer_responses",
            "chat_rooms",
            "chat_messages",
            "bookings",
        ]
        for tbl in tables_to_check:
            count = (await db.execute(text(f'SELECT COUNT(*) FROM "{tbl}"'))).scalar()
            print(f"  • {tbl:<25}: {count} dòng")
    print("=" * 65)
    print("🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC TẠO VÀ ĐỒNG BỘ THÀNH CÔNG!")


if __name__ == "__main__":
    asyncio.run(seed_all())
