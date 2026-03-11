import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SampleService } from "src/sample/sample.service";

/**
 * Guard to check if the authenticated user share workspace access with the current candidate
 */
export class WorkspaceGuard implements CanActivate {

    constructor(private readonly candidateService: SampleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.headers['x-workspace-id'];
    if (!workspaceId) {
      throw new UnauthorizedException('Missing x-workspace-id header');
    }
    const candidateId = request.params.id;
    if (!candidateId) {
      return true; // route has nothing to do with candidates
    }

    const candidate = await this.candidateService.getCandidateByIdAndWorkspaceId(candidateId, workspaceId);
    if (!candidate) {
      return false; // candidate not found or not in workspace
    }
    
    // attach candidate to request
    request.candidate = candidate;
    return true;
  }
}
