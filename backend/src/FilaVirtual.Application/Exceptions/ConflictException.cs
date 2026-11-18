namespace FilaVirtual.Application.Exceptions;

public class ConflictException(string message) : Exception(message);

public class RegistroDuplicadoException(string message = "Já existe um registro com esses dados.")
    : ConflictException(message);

public class ConcorrenciaException(string message = "Os dados foram alterados por outra pessoa. Tente novamente.")
    : ConflictException(message);
