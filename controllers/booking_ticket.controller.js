const requestQueue = []; // Hàng đợi lưu trữ các request

// Hàm thêm request vào hàng đợi
function addToQueue(request) {
    requestQueue.push(request);
    // Sắp xếp lại hàng đợi theo số lượng ghế (ưu tiên nhiều ghế hơn)
    requestQueue.sort((a, b) => b.seatIds.length - a.seatIds.length);
}

// Hàm xử lý từng request
async function handleRequest(req, res) {
  const { showtimeId, seatIds, paymentMethod, userId } = req.body;

  if (!showtimeId || !seatIds || !paymentMethod || !userId) {
    return res
      .status(400)
      .json({ status: "fail", message: "Thiếu thông tin đặt vé." });
  }

  try {
    await sequelize.transaction(async (t) => {
      const showtime = await Showtime.findOne({
        where: { id: showtimeId },
        transaction: t,
        lock: t.LOCK.UPDATE,
        include: [{ model: db.Theater, as: "theater" }],
      });

      if (!showtime) throw new Error("Suất chiếu không tồn tại.");

      // Lấy tất cả các ghế còn trống
      const availableSeats = await Seat.findAll({
        where: {
          theater_id: showtime.theater_id,
        },
        include: [
          {
            model: Ticket,
            as: "tickets",
            where: {
              showtime_id: showtimeId,
              payment_status: { [Op.in]: ["pending", "completed"] },
            },
            required: false,
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
        having: sequelize.where(sequelize.col("tickets.id"), "IS", null),
      });

      const availableSeatsCount = availableSeats.length;

      // Kiểm tra nếu không đủ ghế
      if (availableSeatsCount < seatIds.length) {
        throw new Error("Không đủ số ghế trống để đặt vé.");
      }

      // Lấy tất cả giao dịch `pending` liên quan đến suất chiếu này
      const conflictingTransactions = await Ticket.findAll({
        where: {
          showtime_id: showtimeId,
          payment_status: "pending",
        },
        include: [
          {
            model: Seat,
            as: "seats",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      // Kiểm tra nếu có giao dịch nhỏ hơn giao dịch hiện tại
      const transactionsToRollback = conflictingTransactions.filter(
        (transaction) => transaction.seats.length < seatIds.length
      );

      // Rollback các giao dịch nhỏ hơn
      for (const transaction of transactionsToRollback) {
        await Ticket.destroy({
          where: { id: transaction.id },
          transaction: t,
        });
      }

      // Kiểm tra lại số ghế trống sau khi rollback
      const refreshedAvailableSeats = await Seat.findAll({
        where: {
          theater_id: showtime.theater_id,
        },
        include: [
          {
            model: Ticket,
            as: "tickets",
            where: {
              showtime_id: showtimeId,
              payment_status: { [Op.in]: ["pending", "completed"] },
            },
            required: false,
          },
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
        having: sequelize.where(sequelize.col("tickets.id"), "IS", null),
      });

      if (refreshedAvailableSeats.length < seatIds.length) {
        throw new Error("Không đủ ghế trống để đặt vé sau khi ưu tiên.");
      }

      // Kiểm tra từng ghế trước khi đặt
      for (const seatId of seatIds) {
        const isAvailable = await isSeatAvailable(showtimeId, seatId, t);
        if (!isAvailable) {
          throw new Error(`Ghế ${seatId} đã được đặt bởi người khác.`);
        }
      }

      // Tính tổng giá tiền
      const totalPrice = refreshedAvailableSeats
        .filter((seat) => seatIds.includes(seat.id))
        .reduce(
          (total, seat) =>
            total + parseFloat(showtime.price) + parseFloat(seat.price),
          0
        );

      // Tạo vé
      const createdTicket = await Ticket.create(
        {
          user_id: userId,
          showtime_id: showtimeId,
          price: totalPrice,
          status: "confirmed",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "paypal" ? "pending" : "completed",
          reserved_at: paymentMethod === "paypal" ? new Date() : null,
        },
        { transaction: t }
      );

      await createdTicket.addSeats(seatIds, { transaction: t });

      res.status(201).json({
        status: "success",
        message: "Đặt vé thành công.",
        data: {
          totalPrice,
          ticketId: createdTicket.id,
        },
      });
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({
      status: "fail",
      message: error.message || "Lỗi khi đặt vé.",
    });
  }
}

// Xử lý hàng đợi
async function processQueue() {
  while (requestQueue.length > 0) {
    const { req, res } = requestQueue.shift();
    await handleRequest(req, res);
  }
}
// API nhận request và thêm vào hàng đợi
exports.createTicketApi = async (req, res) => {
    // Thêm request vào hàng đợi
    addToQueue({ req, res });

    // Xử lý hàng đợi
    await processQueue();
};