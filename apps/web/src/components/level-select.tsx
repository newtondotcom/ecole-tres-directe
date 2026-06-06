import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@etd/ui/components/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@etd/ui/components/dropdown-menu";
import { ChevronDownIcon, DotIcon } from "lucide-react";
import { useEffect } from "react";
import { useLevelsStore } from "@/stores/levels";
import { useAuthStore } from "@/stores/auth";
import { formatTrimesterLabel, getTrimesterLabel, getTrimesterPeriods } from "@/lib/period";

export function LevelSelect() {
  const { session, account } = useAuthStore();
  const {
    levels,
    isLoading,
    selectedSchool,
    selectedLevel,
    selectedClass,
    selectedPeriod,
    getLevels,
    setSelectedLevel,
    setSelectedClass,
    setSelectedPeriod,
  } = useLevelsStore();

  useEffect(() => {
    if (session && account) {
      getLevels(session, account.id);
    }
  }, [session, account, getLevels]);

  // Get levels only from the selected school
  const schoolLevels = selectedSchool?.levels ?? [];

  // Get classes for the selected level
  const availableClasses = selectedLevel?.classes ?? [];
  const availablePeriods = getTrimesterPeriods(selectedClass?.periods ?? []);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!levels || !selectedSchool) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger openOnHover className="flex items-center gap-1" accessKey="niveaux">
              {selectedLevel?.label ?? "Sélectionner un niveau"}
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {schoolLevels.map((level) => (
                  <DropdownMenuItem key={level.label} onClick={() => setSelectedLevel(level)}>
                    {level.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger openOnHover
              className="flex items-center gap-1"
              accessKey="classes"
              disabled={!selectedLevel || availableClasses.length === 0}
            >
              {selectedClass?.label ?? "Sélectionner une classe"}
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {availableClasses.map((classItem) => (
                  <DropdownMenuItem key={classItem.id} onClick={() => setSelectedClass(classItem)}>
                    {classItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger openOnHover
              className="flex items-center gap-1"
              accessKey="periodes"
              disabled={!selectedClass || availablePeriods.length === 0}
            >
              {selectedPeriod && selectedClass
                ? getTrimesterLabel(selectedPeriod, selectedClass.periods)
                : "Sélectionner une période"}
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {availablePeriods.map((period, index) => (
                  <DropdownMenuItem key={period.code} onClick={() => setSelectedPeriod(period)}>
                    {formatTrimesterLabel(index)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
