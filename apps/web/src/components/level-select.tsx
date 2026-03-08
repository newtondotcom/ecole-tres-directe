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

export function LevelSelect() {
  const { session, account } = useAuthStore();
  const {
    levels,
    isLoading,
    selectedSchool,
    selectedLevel,
    selectedClass,
    getLevels,
    setSelectedLevel,
    setSelectedClass,
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
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1" accessKey="niveaux">
                {selectedLevel?.label ?? "Sélectionner un niveau"}
                <ChevronDownIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {schoolLevels.map((level) => (
                  <DropdownMenuItem key={level.label} onSelect={() => setSelectedLevel(level)}>
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
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1"
                accessKey="classes"
                disabled={!selectedLevel || availableClasses.length === 0}
              >
                {selectedClass?.label ?? "Sélectionner une classe"}
                <ChevronDownIcon className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {availableClasses.map((classItem) => (
                  <DropdownMenuItem key={classItem.id} onSelect={() => setSelectedClass(classItem)}>
                    {classItem.label}
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
