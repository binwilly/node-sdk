import test, { ExecutionContext } from "ava";
import {
  AccessTokenInfo,
  Channel,
  GatewayError,
  GpApiService,
  IntervalToExpire,
} from "../../../../src";
import { BaseGpApiTestConfig } from "../../../../test/Data/BaseGpApiTestConfig";

test("generate access token", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);
  assertAccessTokenResponse(t, accessTokenInfo);
});

test("generate access token with permissions", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.permissions = [
    "PMT_POST_Create",
    "TRN_POST_Authorize",
    "DIS_POST_Accept",
    "TRN_GET_List_Funded",
    "RAS_POST_Create",
  ];
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);
  assertAccessTokenResponse(t, accessTokenInfo);
});

test("generate access token with limited permissions", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.permissions = ["PMT_POST_Create", "TRN_POST_Authorize"];
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);

  t.truthy(accessTokenInfo);
  t.truthy(accessTokenInfo.accessToken);
  t.is(accessTokenInfo.tokenizationAccountName, "tokenization");
  t.is(
    accessTokenInfo.transactionProcessingAccountName,
    "transaction_processing",
  );
  t.is(accessTokenInfo.dataAccountName, "");
  t.is(accessTokenInfo.disputeManagementAccountName, "");
});

test("generate access token with wrong permissions", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.permissions = ["test_1", "test_2"];
  const error = await t.throwsAsync(
    () => GpApiService.generateTransactionKey(config),
    { instanceOf: GatewayError },
  );
  t.truthy(error);
  t.is(error?.responseCode, "40119");
  t.is(error?.message.includes("Invalid permissions"), true);
});

test("generate access token with specific secondsToExpire", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.secondsToExpire = 200;
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);
  assertAccessTokenResponse(t, accessTokenInfo);
});

test("generate access token with specific intervalToExpire", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.intervalToExpire = IntervalToExpire.ONE_HOUR;
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);
  assertAccessTokenResponse(t, accessTokenInfo);
});

test("generate access token with specific expiredDate", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.secondsToExpire = 200;
  config.intervalToExpire = IntervalToExpire.WEEK;
  const accessTokenInfo = await GpApiService.generateTransactionKey(config);
  assertAccessTokenResponse(t, accessTokenInfo);
});

test("generate access token with wrong appId", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.appId += "a";
  const error = await t.throwsAsync(
    () => GpApiService.generateTransactionKey(config),
    { instanceOf: GatewayError },
  );
  t.truthy(error);
  t.is(error?.responseCode, "40004");
  t.is(
    error?.message,
    "Status Code: ACTION_NOT_AUTHORIZED - App credentials not recognized",
  );
});

test("generate access token with wrong appKey", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.appKey += "a";
  const error = await t.throwsAsync(
    () => GpApiService.generateTransactionKey(config),
    { instanceOf: GatewayError },
  );
  t.truthy(error);
  t.is(error?.responseCode, "40004");
  t.is(
    error?.message,
    "Status Code: ACTION_NOT_AUTHORIZED - Credentials not recognized to create access token.",
  );
});

test("generate access token with maximum secondsToExpire", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.secondsToExpire = 604801;
  const error = await t.throwsAsync(
    () => GpApiService.generateTransactionKey(config),
    { instanceOf: GatewayError },
  );
  t.truthy(error);
  t.is(error?.responseCode, "40213");
  t.is(
    error?.message,
    "Status Code: INVALID_REQUEST_DATA - seconds_to_expire contains unexpected data",
  );
});

test("generate access token with invalid secondsToExpire", async (t) => {
  const config = BaseGpApiTestConfig.gpApiSetupConfig(Channel.CardNotPresent);
  config.secondsToExpire = 10;
  const error = await t.throwsAsync(
    () => GpApiService.generateTransactionKey(config),
    { instanceOf: GatewayError },
  );
  t.truthy(error);
  t.is(error?.responseCode, "40213");
  t.is(
    error?.message,
    "Status Code: INVALID_REQUEST_DATA - seconds_to_expire contains unexpected data",
  );
});

const assertAccessTokenResponse = (
  t: ExecutionContext<unknown>,
  accessTokenInfo: AccessTokenInfo,
) => {
  t.truthy(accessTokenInfo);
  t.truthy(accessTokenInfo.accessToken);

  t.is(accessTokenInfo.dataAccountName, "settlement_reporting");
  t.is(accessTokenInfo.disputeManagementAccountName, "dispute_management");
  t.is(accessTokenInfo.tokenizationAccountName, "tokenization");
  t.is(
    accessTokenInfo.transactionProcessingAccountName,
    "transaction_processing",
  );
  t.truthy(accessTokenInfo.transactionProcessingAccountID);
  t.truthy(accessTokenInfo.tokenizationAccountID);
  t.truthy(accessTokenInfo.riskAssessmentAccountID);
  t.truthy(accessTokenInfo.disputeManagementAccountID);
  t.truthy(accessTokenInfo.dataAccountID);
};
