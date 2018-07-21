import winston = require("winston");
import publicIp = require("public-ip");
import http = require("http");
import https = require("https");
import { RequestOptions } from "http";
import Protocols from "./protocols";
import ConfigurationObject from "./configurationObject";

const LogMessages: { [key: string]: string } = {
  911: "There's a problem with the DNS server.",
  dnserr: "DNS error encountered",
  badagent:
    "User agent not permitted or HTTP method is not permitted. Updates have been suspended.",
  abuse:
    "The hostname specified is blocked for update abuse. Updates for specified host have been suspended.",
  numhost:
    "To many hostnames have been provided. A maximum of 20 are allowed. Updates have been suspended.",
  nohost: "The specified hostname does not exist in the DNS records.",
  nofqdn: "The hostname specified is not a fully qualified domain name.",
  badauth: "Failed authenticatino to server.",
  good: "DNS Record has successfully been updated.",
  nochg: "No changes have been made.",
  suspendedUpdate: "Reminding you that DNS updating is still suspended."
};

export default class RemoteUpdater {
  private readonly m_sRemoteHostname: string;
  private readonly m_sPath: string;
  private readonly m_sUser: string;
  private readonly m_sPassword: string;
  private readonly m_sDnsRecord: string;
  private readonly m_protocol: Protocols;
  private readonly m_publicIpOptions: publicIp.Options;
  private readonly m_nMaxSuspendedUpdateCount: number;
  private readonly m_bRemindUserOfSuspension: boolean;

  private m_sCurrentIp: string;
  private m_bSuspended: boolean;
  private m_nSuspendedUpdateCount: number;

  public constructor(conf: ConfigurationObject) {
    this.m_sRemoteHostname = <string>conf.remote_hostname;
    this.m_sPath = <string>conf.path;
    this.m_sUser = <string>conf.user;
    this.m_sPassword = <string>conf.password;
    this.m_sDnsRecord = <string>conf.dns_record;
    this.m_protocol = <Protocols>conf.protocol;
    this.m_publicIpOptions = { https: false };
    this.m_nMaxSuspendedUpdateCount = <number>conf.remind_count;
    this.m_bRemindUserOfSuspension = <boolean>conf.remind;
    this.m_sCurrentIp = "";
    this.m_bSuspended = false;
    this.m_nSuspendedUpdateCount = 0;
  }

  public async update(): Promise<void> {
    winston.verbose("Initiating DNS Update");

    if (this.m_bSuspended) {
      winston.verbose(
        "DNS update is currently suspended. No Update performed."
      );
      this.m_nSuspendedUpdateCount++;

      if (
        this.m_bRemindUserOfSuspension &&
        this.m_nSuspendedUpdateCount >= this.m_nMaxSuspendedUpdateCount
      ) {
        winston.warn(LogMessages.suspendedUpdate);
        this.m_nSuspendedUpdateCount = 0;
      }

      return;
    }

    let response: string;
    let sNewIp: string;
    try {
      sNewIp = await publicIp.v4(this.m_publicIpOptions);

      if (sNewIp === this.m_sCurrentIp) {
        winston.info("DNS is up to date.");
        return;
      }

      response = await this.sendRequest(sNewIp);
    } catch (err) {
      /* debug */
      winston.debug(err);
      /* debug-end */

      if (err.message === "Query timed out") {
        winston.error(err.message);
        return;
      }

      //TODO If by chanse i find the actuall internal HTTP(S) request errors. Then implement them here.
      throw err;
    }

    /* debug */
    winston.debug("DNS Response: " + response);
    /* debug-end */

    switch (response) {
      case "911":
        winston.info(LogMessages["911"]);
        break;
      case "dnserr":
      case "badagent":
      case "abuse":
      case "numhost":
      case "nohost":
      case "notfqdn":
      case "badauth":
        this.suspend(response, LogMessages[response]);
        break;
      case `good ${sNewIp}`:
      case "good":
        winston.info("DNS Record has successfully been updated.");
        break;
      case "nochg":
        winston.verbose("No changes have been made.");
        break;
      default:
        this.suspend(response, "Unknown response received");
        break;
    }
  }

  private sendRequest(sNewIp: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const path: string = `${this.m_sPath}?hostname=${
        this.m_sDnsRecord
      }&myip=${sNewIp}`;

      const requestOptions: RequestOptions = {
        host: this.m_sRemoteHostname,
        family: 4,
        method: "GET",
        headers: { "User-Agent": process.env.USER_AGENT },
        path: path,
        auth: `${this.m_sUser}:${this.m_sPassword}`
      };

      let request: http.ClientRequest =
        this.m_protocol === Protocols.http
          ? http.request(requestOptions)
          : https.request(requestOptions);

      request.on("error", (err: Error) => {
        reject(err);
      });

      request.on("response", (res: http.ClientResponse) => {
        res.on("data", (data: Buffer) => {
          resolve(data.toString());
        });
      });

      request.end();
    });
  }

  private suspend(code: string, message: string) {
    this.m_bSuspended = true;

    winston.warn(
      `Update failed. DNS Server return code "${code}". ${message}. Suspending updates.`
    );
  }
}
