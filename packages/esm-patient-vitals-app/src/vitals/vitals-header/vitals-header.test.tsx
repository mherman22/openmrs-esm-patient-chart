import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openmrsFetch } from '@openmrs/esm-framework';
import { launchPatientWorkspace } from '@openmrs/esm-patient-common-lib';
import { getByTextWithMarkup, swrRender, waitForLoadingToFinish } from '../../../../../tools/test-helpers';
import { mockPatient } from '../../../../../__mocks__/patient.mock';
import {
  mockConceptMetadata,
  mockFhirVitalsResponse,
  mockVitalsConfig,
  mockVitalsSignsConcept,
} from '../../../../../__mocks__/vitals.mock';
import VitalsHeader from './vitals-header.component';
import { patientVitalsBiometricsFormWorkspace } from '../../constants';

const testProps = {
  patientUuid: mockPatient.id,
  showRecordVitalsButton: true,
};

const mockConceptUnits = new Map<string, string>(
  mockVitalsSignsConcept.data.results[0].setMembers.map((concept) => [concept.uuid, concept.units]),
);

const mockOpenmrsFetch = openmrsFetch as jest.Mock;
const mockLaunchWorkspace = launchPatientWorkspace as jest.Mock;

jest.mock('@openmrs/esm-patient-common-lib', () => {
  const originalModule = jest.requireActual('@openmrs/esm-patient-common-lib');

  return {
    ...originalModule,
    launchPatientWorkspace: jest.fn(),
    useVitalsConceptMetadata: jest.fn().mockImplementation(() => ({
      data: mockConceptUnits,
      conceptMetadata: mockConceptMetadata,
    })),
  };
});

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');

  return {
    ...originalModule,
    useConfig: jest.fn(() => mockVitalsConfig),
  };
});

describe('VitalsHeader: ', () => {
  it('renders an empty state view when there are no vitals data to show', async () => {
    mockOpenmrsFetch.mockReturnValueOnce({ data: [] });

    renderVitalsHeader();

    await waitForLoadingToFinish();

    expect(screen.getByText(/vitals and biometrics/i)).toBeInTheDocument();
    expect(screen.getByText(/no data has been recorded for this patient/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record vitals/i })).toBeInTheDocument();
  });

  it('renders the most recently recorded vitals in the vitals header', async () => {
    mockOpenmrsFetch.mockReturnValue({ data: mockFhirVitalsResponse });

    renderVitalsHeader();

    await waitForLoadingToFinish();

    expect(screen.getByText(/Vitals and biometrics/i)).toBeInTheDocument();
    expect(screen.getByText(/Last recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/19 — May — 2021/i)).toBeInTheDocument();
    expect(screen.getByText(/Record vitals/i)).toBeInTheDocument();

    const expandButton = screen.getByTitle(/ChevronDown/);
    userEvent.click(expandButton);

    expect(getByTextWithMarkup(/Temp\s*37\s*DEG C/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/BP\s*121 \/ 89\s*mmHg/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/Heart rate\s*76\s*beats\/min/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/SpO2\s*-\s*/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/R\. Rate\s*12\s*breaths\/min/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/Height\s*-\s*/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/BMI\s*-\s*/i)).toBeInTheDocument();
    expect(getByTextWithMarkup(/Weight\s*-\s*/i)).toBeInTheDocument();

    expect(screen.getByRole('img', { name: /warning/i })).toBeInTheDocument();
    expect(screen.getAllByTitle(/abnormal value/i).length).toEqual(2);

    const collapseButton = screen.getByTitle(/ChevronUp/);
    userEvent.click(collapseButton);

    expect(screen.queryByText(/Temp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BP/i)).not.toBeInTheDocument();
  });

  it('launches the vitals form when the `record vitals` button gets clicked', async () => {
    renderVitalsHeader();

    await waitForLoadingToFinish();

    const recordVitalsButton = screen.getByText(/Record vitals/i);
    userEvent.click(recordVitalsButton);

    expect(mockLaunchWorkspace).toHaveBeenCalledTimes(1);
    expect(mockLaunchWorkspace).toHaveBeenCalledWith(patientVitalsBiometricsFormWorkspace);
  });
});

function renderVitalsHeader() {
  swrRender(<VitalsHeader {...testProps} />);
}
