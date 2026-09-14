return NextResponse.json({
  success: true,
  clientId,

  diagnostics: {
    clientBriefFound:
      stages.some(
        (stage) =>
          stage.stage_number === 2 &&
          stage.status === "completed"
      ),

    stage2Status:
      stages.find(
        (stage) =>
          stage.stage_number === 2
      )?.status || null,

    stage3Status:
      stages.find(
        (stage) =>
          stage.stage_number === 3
      )?.status || null,
  },

  stages,
  currentStage,
  completedStageCount,
  totalStages:
    stages.length,
  progressPercentage,
});