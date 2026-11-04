export const processPayment = async (req, res) => {
  try {
    const { method, amount, customerInfo, accountOrCardNumber } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount requested',
      });
    }

    const channel = method ? method.toUpperCase() : 'COD';
    const txnId = `TXN-${channel}-${Math.floor(10000000 + Math.random() * 90000000)}`;

    res.status(200).json({
      success: true,
      message:
        method === 'cod'
          ? 'Cash On Delivery approved. Payment to be collected upon parcel handover.'
          : `${channel} transaction authorized successfully.`,
      transactionId: txnId,
      method: method || 'cod',
      amount: Number(amount),
      currency: 'BDT',
      status: method === 'cod' ? 'COD_PENDING' : 'SETTLED',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment gateway error',
      error: error.message,
    });
  }
};
