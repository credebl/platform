import { Logger } from "@nestjs/common";
import { AgentStartService } from "./start_agent";

const [
    AGENCY,
    EXTERNAL_IP,
    WALLET_NAME,
    WALLET_PASSWORD,
    WEBHOOK_HOST,
    WALLET_STORAGE_HOST,
    WALLET_STORAGE_PORT,
    WALLET_STORAGE_USER,
    WALLET_STORAGE_PASSWORD,
    CONTAINER_NAME,
    PROTOCOL,
    TENANT,
    AFJ_VERSION,
    INDY_LEDGER
] = process.argv.slice(2);
const agentStartService = new AgentStartService(new Logger);
agentStartService.startAgent(
    AGENCY,
    EXTERNAL_IP,
    WALLET_NAME,
    WALLET_PASSWORD,
    WEBHOOK_HOST,
    WALLET_STORAGE_HOST,
    WALLET_STORAGE_PORT,
    WALLET_STORAGE_USER,
    WALLET_STORAGE_PASSWORD,
    CONTAINER_NAME,
    PROTOCOL,
    TENANT,
    AFJ_VERSION,
    INDY_LEDGER
);