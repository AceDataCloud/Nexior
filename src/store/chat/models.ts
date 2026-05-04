import { IApplication, IChatConversation, IChatModel, IChatModelGroup, ICredential, IService, Status } from '@/models';

export interface IChatState {
  model: IChatModel;
  modelGroup: IChatModelGroup;
  applications: IApplication[] | undefined;
  application: IApplication | undefined;
  service: IService | undefined;
  conversations: IChatConversation[] | undefined;
  credential: ICredential | undefined;
  /** Composer text that should survive a route-level remount, e.g.
   *  the user clicks ChatGPT in the sidebar while editing a draft
   *  in the Claude page. The Conversation page mirrors
   *  ``this.question`` here on every keystroke and consumes it
   *  back into local state on mount. Cleared once the message is
   *  submitted. Also used by the cross-site ``?query=`` deep-link
   *  entry-point (AuthFrontend connector "Try It" chips) so the
   *  prompt persists across an in-flight model-group switch. */
  pendingDraft: string;
  status: {
    getService: Status;
    getApplications: Status;
    getConversations: Status;
  };
}
