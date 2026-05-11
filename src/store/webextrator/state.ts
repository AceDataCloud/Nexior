import { IWebextratorState } from './models';
import { Status } from '@/models';

export default (): IWebextratorState => {
  return {
    service: undefined,
    application: undefined,
    applications: undefined,
    credential: undefined,
    config: {
      mode: 'extract',
      wait_until: 'networkidle',
      expected_type: 'general',
      enable_llm: false,
      timeout: 30,
      block_resources: ['image', 'font', 'media']
    },
    response: undefined,
    status: {
      getService: Status.None,
      getApplications: Status.None,
      run: Status.None
    }
  };
};
