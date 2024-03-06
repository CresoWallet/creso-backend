import { Router } from "express";
import { WalletController } from "../controller/wallet";
import { authenticateJwt } from "../middleware";

const router = Router();
const walletController: WalletController = new WalletController();

router.get("/wallet", authenticateJwt, walletController.getWallet);

router.get("/wallets/eoa", authenticateJwt, walletController.getEOAWallets);

router.get(
  "/wallets/aa/:address",
  authenticateJwt,
  walletController.getAAWallets
);

// router.post("/create/wallet", authenticateJwt, walletController.createWallet);

router.post("/wallet/eoa", authenticateJwt, walletController.createWallet);

// router.post(
//   "/create/smartwallet",
//   authenticateJwt,
//   walletController.createSmartWallet
// );

router.post("/wallet/aa", authenticateJwt, walletController.createSmartWallet);

router.post(
  "/wallet/import",
  authenticateJwt,
  walletController.importExistingWallet
);

router.post("/history", authenticateJwt, walletController.getHistory);

// router.get(
//   "/assets/balance",
//   authenticateJwt,
//   walletController.getAssetBalance
// );

router.get("/wallets/:address/balance", walletController.getAssetBalance);

router.get(
  "/wallets/:address/transactions",
  walletController.getWalletTransactions
);

// router.post("/transfer", authenticateJwt, walletController.makeTransfer);
router.post("/transactions", authenticateJwt, walletController.makeTransfer);
router.post(
  "/action/:action_type",
  authenticateJwt,
  walletController.initiateAction
);

router.post(
  "/sign_transaction/:transaction_id",
  authenticateJwt,
  walletController.signTransaction
);

router.get(
  "/transactions/:transaction_id",
  authenticateJwt,
  walletController.getTxnDetails
);

router.get(
  "/token/:address/balance/:token_address",
  authenticateJwt,
  walletController.getTokenBalance
);

router.post(
  "/tokens/transfer",
  authenticateJwt,
  walletController.transferToken
);

router.post("/backup/wallet", authenticateJwt, walletController.backupWallet);

router.post("/import/wallet", authenticateJwt, walletController.importWallet);

router.post(
  "/get/user/tokens",
  authenticateJwt,
  walletController.getUserAddedTokens
);

//guardian
router.post("/add/guardian", authenticateJwt, walletController.addGuardian);
router.post(
  "/remove/guardian",
  authenticateJwt,
  walletController.removeGuardian
);
router.post("/start/guardian", authenticateJwt, walletController.startRecovery);
router.post(
  "/confirm/guardian",
  authenticateJwt,
  walletController.confirmRecovery
);

router.post(
  "/recoveryStatus",
  authenticateJwt,
  walletController.getRecoveryStatus
);
router.post(
  "/get/guardian",
  authenticateJwt,
  walletController.getWalletGuardians
);

router.get(
  "/guardedWallets",
  authenticateJwt,
  walletController.getGuardedWallets
);

router.post("/test", walletController.testApi);

export { router as wallet };
