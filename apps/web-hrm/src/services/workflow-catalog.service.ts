import type { PeoplePolicy, WorkflowTemplate } from './domain';

import {
  offboardingTemplatesMock,
  onboardingTemplatesMock,
  peoplePoliciesMock,
} from '#/mocks/workflows';

export type { PeoplePolicy, WorkflowTemplate } from './domain';

export const workflowCatalogService = {
  async listTemplates(process: WorkflowTemplate['process']) {
    const catalog =
      process === 'onboarding'
        ? onboardingTemplatesMock
        : offboardingTemplatesMock;
    return structuredClone(catalog);
  },

  async listPeoplePolicies(): Promise<PeoplePolicy[]> {
    return structuredClone(peoplePoliciesMock);
  },
};
