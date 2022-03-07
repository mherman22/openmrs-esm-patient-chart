import React from 'react';
import { useRecommendedVisitTypes } from '../hooks/useRecommendedVisitTypes';
import BaseVisitType from './base-visit-type.component';
import { PatientProgram } from '@openmrs/esm-patient-common-lib';

interface RecommendedVisitTypeProp {
  patientUuid: string;
  patientProgramEnrollment: PatientProgram;
  onChange: (visitTypeUuid) => void;
  locationUuid: string;
}

const RecommendedVisitType: React.FC<RecommendedVisitTypeProp> = ({
  patientUuid,
  patientProgramEnrollment,
  onChange,
  locationUuid,
}) => {
  const { recommendedVisitTypes, error } = useRecommendedVisitTypes(
    patientUuid,
    patientProgramEnrollment?.uuid,
    patientProgramEnrollment?.program?.uuid,
    locationUuid,
  );

  return (
    <div style={{ marginTop: '0.625rem' }}>
      <BaseVisitType onChange={onChange} visitTypes={recommendedVisitTypes} patientUuid={patientUuid} />
    </div>
  );
};

export const MemoizedRecommendedVisitType = React.memo(RecommendedVisitType);
