import DeepCode from "../interfaces/DeepCodeInterfaces";
import { ExtensionContext, Memento } from "vscode";
import { stateNames } from "../deepcode/constants/stateNames";

class DeepCodeStore implements DeepCode.ExtensionStoreInterface {
  private globalState: Memento | any = {};
  private workspaceState: Memento | any = {};
  public selectors: DeepCode.StateSelectorsInterface = {};
  public actions: DeepCode.StateSelectorsInterface = {};

  private createSelectors(): DeepCode.StateSelectorsInterface {
    return {
      getLoggedInStatus: (): string | undefined =>
        this.globalState.get(stateNames.isLoggedIn),

      getConfirmUploadStatus: (
        // workspace can contain multiple folders and each of them will have is confirm status
        folderPath: ""
      ): string | undefined | { [key: string]: boolean } => {
        const workspaceConfirms = this.workspaceState.get(
          stateNames.confirmedDownload
        );
        if (!folderPath) {
          return workspaceConfirms;
        }
        return workspaceConfirms[folderPath];
      },
      getSessionToken: (): string | undefined =>
        this.globalState.get(stateNames.sessionToken),
      getBackendConfigStatus: (): string | undefined =>
        this.globalState.get(stateNames.isBackendConfigured)
    };
  }

  private createStateActions(): DeepCode.StateSelectorsInterface {
    return {
      setLoggedInStatus: (status: boolean): Thenable<void> =>
        this.globalState.update(stateNames.isLoggedIn, status),
      setConfirmUploadStatus: (
        folderPath: string,
        status: boolean
      ): Thenable<void> => {
        if (!folderPath && !status) {
          return this.workspaceState.update(stateNames.confirmedDownload, {});
        }
        const workspaceConfirms = this.selectors.getConfirmUploadStatus();
        return this.workspaceState.update(stateNames.confirmedDownload, {
          ...workspaceConfirms,
          [folderPath]: status
        });
      },
      setSessionToken: (token: string): Thenable<void> =>
        this.globalState.update(stateNames.sessionToken, token),
      setBackendConfigStatus: (status: boolean = true): Thenable<void> =>
        this.globalState.update(stateNames.isBackendConfigured, status)
    };
  }

  public cleanStore(): void {
    this.actions.setLoggedInStatus(false);
    this.actions.setSessionToken("");
    this.actions.setConfirmUploadStatus();
    this.actions.setBackendConfigStatus(false);
  }

  public async createStore(context: ExtensionContext): Promise<void> {
    this.globalState = context.globalState;
    this.workspaceState = context.workspaceState;
    this.selectors = { ...this.createSelectors() };
    this.actions = { ...this.createStateActions() };
    if (!this.selectors.getConfirmUploadStatus()) {
      this.actions.setConfirmUploadStatus();
    }
  }
}

export default DeepCodeStore;
