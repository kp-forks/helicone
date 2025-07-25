import { CheckCircleIcon } from "@heroicons/react/20/solid";

export default function StepList(props: {
  currentStep: number;
  setStep: (value: number) => void;
  allowStepSelection: boolean;
}) {
  const { currentStep, setStep, allowStepSelection } = props;

  const steps = [
    {
      name: "Create your organization",
      step: 1,
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
            ? "complete"
            : "upcoming",
    },
    {
      name: "Integrate with Helicone",
      step: 2,
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
            ? "complete"
            : "upcoming",
    },
    {
      name: "Send your first event",
      step: 3,
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
            ? "complete"
            : "upcoming",
    },
    {
      name: "Explore features and tooling",
      step: 4,
      status:
        currentStep === 4
          ? "current"
          : currentStep > 4
            ? "complete"
            : "upcoming",
    },
  ];

  return (
    <nav className="flex flex-col space-y-4" aria-label="Progress">
      <ol role="list" className="space-y-6">
        {steps.map((step) => (
          <li key={step.name}>
            {step.status === "complete" ? (
              <button
                onClick={() => {
                  if (allowStepSelection) {
                    setStep(step.step);
                  }
                }}
                className={`group ${
                  !allowStepSelection ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={!allowStepSelection}
              >
                <span className="flex items-start">
                  <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <CheckCircleIcon
                      className="h-full w-full text-sky-600 group-hover:text-sky-800"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                    {step.name}
                  </span>
                </span>
              </button>
            ) : step.status === "current" ? (
              <button
                onClick={() => {
                  if (allowStepSelection) {
                    setStep(step.step);
                  }
                }}
                className={`flex items-start ${
                  !allowStepSelection ? "cursor-not-allowed opacity-50" : ""
                }`}
                aria-current="step"
                disabled={!allowStepSelection}
              >
                <span
                  className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="absolute h-4 w-4 rounded-full bg-sky-200" />
                  <span className="relative block h-2 w-2 rounded-full bg-sky-600" />
                </span>
                <span className="ml-3 text-sm font-medium text-sky-600">
                  {step.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (allowStepSelection) {
                    setStep(step.step);
                  }
                }}
                className={`group ${
                  !allowStepSelection ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={!allowStepSelection}
              >
                <div className="flex items-start">
                  <div
                    className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                  </div>
                  <p className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                    {step.name}
                  </p>
                </div>
              </button>
            )}
          </li>
        ))}
      </ol>
      {currentStep > 1 && (
        <button
          onClick={() => setStep(currentStep - 1)}
          className="self-start text-sm font-medium text-sky-600 hover:text-sky-800"
        >
          &larr; Back
        </button>
      )}
    </nav>
  );
}
