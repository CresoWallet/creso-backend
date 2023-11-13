import { Router } from "express";
import { WalletController } from "../controller/wallet";
import { authenticateJwt } from "../middleware";

const router = Router();
const walletController: WalletController = new WalletController();

router.get("/wallet", authenticateJwt, walletController.getWallet);



router.post("/create/wallet", authenticateJwt, walletController.createWallet);

router.post("/create/smartwallet", authenticateJwt, walletController.createSmartWallet);

router.post("/history", authenticateJwt, walletController.getHistory);

router.get("/assets/balance", authenticateJwt, walletController.getAssetBalance);

//
router.post("/transfer", authenticateJwt, walletController.makeTransfer);


router.post("/test", walletController.testApi);


export { router as wallet };
