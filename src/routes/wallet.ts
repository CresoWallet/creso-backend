import { Router } from "express";
import { WalletController } from "../controller/wallet";
import { authenticateJwt } from "../middleware";

const router = Router();
const walletController: WalletController = new WalletController();

router.get("/wallet", authenticateJwt, walletController.getWallet);

router.post("/backup/wallet", authenticateJwt, walletController.backupWallet);

router.post("/create/wallet", authenticateJwt, walletController.createWallet);

router.post("/create/smartwallet", authenticateJwt, walletController.createSmartWallet);

router.post("/history", authenticateJwt, walletController.getHistory);

router.get("/assets/balance", authenticateJwt, walletController.getAssetBalance);

router.post("/transfer", authenticateJwt, walletController.makeTransfer);

//guardian
router.post("/add/guardian", authenticateJwt, walletController.addGuardian);
router.post("/add/guardian", authenticateJwt, walletController.removeGuardian);
router.post("/add/guardian", authenticateJwt, walletController.startRecovery);
router.post("/add/guardian", authenticateJwt, walletController.confirmRecovery);

router.post("/test", walletController.testApi);


export { router as wallet };
